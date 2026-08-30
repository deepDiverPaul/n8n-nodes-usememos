/* eslint-disable n8n-nodes-base/node-class-description-icon-not-svg */
import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';
import { apiRequest, apiRequestAllItems } from './GenericFunctions';

export class Memos implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Memos',
		name: 'memos',
		icon: 'file:memos.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Consume Memos API',
		defaults: {
			name: 'Memos',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'memosApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Memo',
						value: 'memo',
					},
					{
						name: 'User',
						value: 'user',
					},
				],
				default: 'memo',
			},
			// Memo Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['memo'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a memo',
						action: 'Create a memo',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a memo',
						action: 'Delete a memo',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a memo',
						action: 'Get a memo',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many memos',
						action: 'Get many memos',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a memo',
						action: 'Update a memo',
					},
				],
				default: 'create',
			},
			// User Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['user'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a user',
						action: 'Get a user',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many users',
						action: 'Get many users',
					},
					{
						name: 'Get Current User',
						value: 'getMe',
						description: 'Get the current authenticated user',
						action: 'Get current user',
					},
				],
				default: 'getMe',
			},
			// Memo -> Create
			{
				displayName: 'Content',
				name: 'content',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['memo'],
						operation: ['create'],
					},
				},
				description: 'The content of the memo in Markdown format',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['memo'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Pinned',
						name: 'pinned',
						type: 'boolean',
						default: false,
						description: 'Whether the memo is pinned',
					},
					{
						displayName: 'State',
						name: 'state',
						type: 'options',
						options: [
							{
								name: 'Normal',
								value: 'NORMAL',
							},
							{
								name: 'Archived',
								value: 'ARCHIVED',
							},
						],
						default: 'NORMAL',
						description: 'The state of the memo',
					},
					{
						displayName: 'Visibility',
						name: 'visibility',
						type: 'options',
						options: [
							{
								name: 'Private',
								value: 'PRIVATE',
							},
							{
								name: 'Protected',
								value: 'PROTECTED',
							},
							{
								name: 'Public',
								value: 'PUBLIC',
							},
						],
						default: 'PRIVATE',
						description: 'The visibility level of the memo',
					},
				],
			},
			// Memo -> Delete & Get
			{
				displayName: 'Memo ID',
				name: 'memoId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['memo'],
						operation: ['delete', 'get'],
					},
				},
				description: 'The ID or name of the memo (e.g. 123 or memos/123)',
			},
			// Memo -> GetAll
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['memo'],
						operation: ['getAll'],
					},
				},
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['memo'],
						operation: ['getAll'],
						returnAll: [false],
					},
				},
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				description: 'Max number of results to return',
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: {
					show: {
						resource: ['memo'],
						operation: ['getAll'],
					},
				},
				options: [
					{
						displayName: 'CEL Filter',
						name: 'filter',
						type: 'string',
						default: '',
						placeholder: 'creator == "users/1"',
						description: 'A CEL expression filter (e.g. creator == "users/1" || "work" in tags)',
					},
					{
						displayName: 'Order By',
						name: 'orderBy',
						type: 'string',
						default: 'create_time desc',
						description: 'The order to sort results by (e.g. "create_time desc", "pinned desc")',
					},
					{
						displayName: 'State',
						name: 'state',
						type: 'options',
						options: [
							{
								name: 'Archived',
								value: 'ARCHIVED',
							},
							{
								name: 'Normal',
								value: 'NORMAL',
							},
							{
								name: 'Unspecified',
								value: 'STATE_UNSPECIFIED',
							},
						],
						default: 'NORMAL',
						description: 'Filter memos by state',
					},
				],
			},
			// Memo -> Update
			{
				displayName: 'Memo ID',
				name: 'memoId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['memo'],
						operation: ['update'],
					},
				},
				description: 'The ID or name of the memo to update (e.g. 123 or memos/123)',
			},
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['memo'],
						operation: ['update'],
					},
				},
				options: [
					{
						displayName: 'Content',
						name: 'content',
						type: 'string',
						typeOptions: {
							rows: 4,
						},
						default: '',
						description: 'The updated content in Markdown format',
					},
					{
						displayName: 'Pinned',
						name: 'pinned',
						type: 'boolean',
						default: false,
						description: 'Whether the memo is pinned',
					},
					{
						displayName: 'State',
						name: 'state',
						type: 'options',
						options: [
							{
								name: 'Normal',
								value: 'NORMAL',
							},
							{
								name: 'Archived',
								value: 'ARCHIVED',
							},
						],
						default: 'NORMAL',
						description: 'The updated state of the memo',
					},
					{
						displayName: 'Visibility',
						name: 'visibility',
						type: 'options',
						options: [
							{
								name: 'Private',
								value: 'PRIVATE',
							},
							{
								name: 'Protected',
								value: 'PROTECTED',
							},
							{
								name: 'Public',
								value: 'PUBLIC',
							},
						],
						default: 'PRIVATE',
						description: 'The updated visibility level of the memo',
					},
				],
			},
			// User -> Get
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['user'],
						operation: ['get'],
					},
				},
				description: 'The user ID or username (e.g. 1, users/1, or username)',
			},
			// User -> GetAll
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['user'],
						operation: ['getAll'],
					},
				},
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['user'],
						operation: ['getAll'],
						returnAll: [false],
					},
				},
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				description: 'Max number of results to return',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'memo') {
					if (operation === 'create') {
						const content = this.getNodeParameter('content', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

						const body: IDataObject = {
							content,
							...additionalFields,
						};

						const responseData = await apiRequest.call(this, 'POST', 'memos', body);
						returnData.push({
							json: responseData as IDataObject,
							pairedItem: { item: i },
						});
					} else if (operation === 'delete') {
						let memoId = this.getNodeParameter('memoId', i) as string;
						if (!memoId.includes('/')) {
							memoId = `memos/${memoId}`;
						}

						await apiRequest.call(this, 'DELETE', memoId);
						returnData.push({
							json: { success: true },
							pairedItem: { item: i },
						});
					} else if (operation === 'get') {
						let memoId = this.getNodeParameter('memoId', i) as string;
						if (!memoId.includes('/')) {
							memoId = `memos/${memoId}`;
						}

						const responseData = await apiRequest.call(this, 'GET', memoId);
						returnData.push({
							json: responseData as IDataObject,
							pairedItem: { item: i },
						});
					} else if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i) as IDataObject;
						const qs: IDataObject = {};

						if (filters.state) {
							qs.state = filters.state;
						}
						if (filters.filter) {
							qs.filter = filters.filter;
						}
						if (filters.orderBy) {
							qs.orderBy = filters.orderBy;
						}

						if (returnAll) {
							const memos = await apiRequestAllItems.call(this, 'memos', 'GET', 'memos', {}, qs);
							for (const memo of memos) {
								returnData.push({
									json: memo,
									pairedItem: { item: i },
								});
							}
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							qs.pageSize = limit;
							const responseData = await apiRequest.call(this, 'GET', 'memos', {}, qs);
							const memos = ((responseData.memos || []) as IDataObject[]).slice(0, limit);
							for (const memo of memos) {
								returnData.push({
									json: memo,
									pairedItem: { item: i },
								});
							}
						}
					} else if (operation === 'update') {
						let memoId = this.getNodeParameter('memoId', i) as string;
						if (!memoId.includes('/')) {
							memoId = `memos/${memoId}`;
						}

						const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
						const fieldKeys = Object.keys(updateFields);

						if (fieldKeys.length === 0) {
							throw new NodeOperationError(this.getNode(), 'Please specify at least one field to update', {
								itemIndex: i,
							});
						}

						const qs: IDataObject = {
							updateMask: fieldKeys.join(','),
						};

						const responseData = await apiRequest.call(this, 'PATCH', memoId, updateFields, qs);
						returnData.push({
							json: responseData as IDataObject,
							pairedItem: { item: i },
						});
					}
				} else if (resource === 'user') {
					if (operation === 'get') {
						let userId = this.getNodeParameter('userId', i) as string;
						if (!userId.includes('/')) {
							userId = `users/${userId}`;
						}

						const responseData = await apiRequest.call(this, 'GET', userId);
						returnData.push({
							json: responseData as IDataObject,
							pairedItem: { item: i },
						});
					} else if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;

						if (returnAll) {
							const users = await apiRequestAllItems.call(this, 'users', 'GET', 'users', {}, {});
							for (const user of users) {
								returnData.push({
									json: user,
									pairedItem: { item: i },
								});
							}
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							const qs: IDataObject = { pageSize: limit };
							const responseData = await apiRequest.call(this, 'GET', 'users', {}, qs);
							const users = ((responseData.users || []) as IDataObject[]).slice(0, limit);
							for (const user of users) {
								returnData.push({
									json: user,
									pairedItem: { item: i },
								});
							}
						}
					} else if (operation === 'getMe') {
						const responseData = await apiRequest.call(this, 'GET', 'auth/me');
						returnData.push({
							json: responseData as IDataObject,
							pairedItem: { item: i },
						});
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: { item: i },
					});
					continue;
				}

				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
