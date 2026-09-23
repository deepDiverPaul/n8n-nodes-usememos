/* eslint-disable n8n-nodes-base/node-class-description-icon-not-svg */
import {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	JsonObject,
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';
import { apiRequest, apiRequestAllItems, formatAttachmentReferences } from './GenericFunctions';

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
						name: 'Attachment',
						value: 'attachment',
					},
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
			// Attachment Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['attachment'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create an attachment',
						action: 'Create an attachment',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete an attachment',
						action: 'Delete an attachment',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get an attachment',
						action: 'Get an attachment',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many attachments',
						action: 'Get many attachments',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update an attachment',
						action: 'Update an attachment',
					},
				],
				default: 'create',
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
			// Attachment -> Create
			{
				displayName: 'Binary File',
				name: 'binaryData',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						resource: ['attachment'],
						operation: ['create'],
					},
				},
				description: 'Whether the attachment should be created from incoming binary data',
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						resource: ['attachment'],
						operation: ['create'],
						binaryData: [true],
					},
				},
				description: 'Name of the binary property to create the attachment from',
			},
			{
				displayName: 'Filename',
				name: 'filename',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['attachment'],
						operation: ['create'],
						binaryData: [false],
					},
				},
				description: 'The filename of the attachment (e.g. document.pdf, photo.png)',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['attachment'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Content (Base64)',
						name: 'content',
						type: 'string',
						default: '',
						description: 'The base64-encoded content of the attachment',
					},
					{
						displayName: 'External Link',
						name: 'externalLink',
						type: 'string',
						default: '',
						description: 'The external link/URL of the attachment',
					},
					{
						displayName: 'Filename',
						name: 'filename',
						type: 'string',
						default: '',
						description: 'Override filename for the attachment',
					},
					{
						displayName: 'Memo ID',
						name: 'memo',
						type: 'string',
						default: '',
						description: 'The related memo ID or name (e.g. 123 or memos/123) to link this attachment to',
					},
					{
						displayName: 'MIME Type',
						name: 'type',
						type: 'string',
						default: '',
						placeholder: 'image/png',
						description: 'The MIME type of the attachment (e.g. image/png, application/pdf)',
					},
				],
			},
			// Attachment -> Delete & Get
			{
				displayName: 'Attachment ID',
				name: 'attachmentId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['attachment'],
						operation: ['delete', 'get'],
					},
				},
				description: 'The ID or name of the attachment (e.g. 123 or attachments/123)',
			},
			// Attachment -> GetAll
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['attachment'],
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
						resource: ['attachment'],
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
						resource: ['attachment'],
						operation: ['getAll'],
					},
				},
				options: [
					{
						displayName: 'CEL Filter',
						name: 'filter',
						type: 'string',
						default: '',
						placeholder: 'mime_type == "image/png"',
						description: 'A CEL expression filter (e.g. mime_type == "image/png" || filename.contains("test"))',
					},
					{
						displayName: 'Order By',
						name: 'orderBy',
						type: 'string',
						default: 'create_time desc',
						description: 'The order to sort results by (e.g. "create_time desc", "filename asc")',
					},
				],
			},
			// Attachment -> Update
			{
				displayName: 'Attachment ID',
				name: 'attachmentId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['attachment'],
						operation: ['update'],
					},
				},
				description: 'The ID or name of the attachment to update (e.g. 123 or attachments/123)',
			},
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['attachment'],
						operation: ['update'],
					},
				},
				options: [
					{
						displayName: 'Content (Base64)',
						name: 'content',
						type: 'string',
						default: '',
						description: 'The updated base64-encoded content of the attachment',
					},
					{
						displayName: 'External Link',
						name: 'externalLink',
						type: 'string',
						default: '',
						description: 'The updated external link of the attachment',
					},
					{
						displayName: 'Filename',
						name: 'filename',
						type: 'string',
						default: '',
						description: 'The updated filename of the attachment',
					},
					{
						displayName: 'Memo ID',
						name: 'memo',
						type: 'string',
						default: '',
						description: 'The related memo ID or name to link to (e.g. 123 or memos/123). Leave empty to unlink.',
					},
					{
						displayName: 'MIME Type',
						name: 'type',
						type: 'string',
						default: '',
						description: 'The updated MIME type of the attachment',
					},
				],
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
						displayName: 'Attachments',
						name: 'attachments',
						type: 'string',
						default: '',
						placeholder: '123, 456 or attachments/123',
						description: 'Comma-separated list or JSON array of attachment IDs or names to link',
					},
					{
						displayName: 'Pinned',
						name: 'pinned',
						type: 'boolean',
						default: false,
						description: 'Whether the memo is pinned',
					},
					{
						displayName: 'Space Name or ID',
						name: 'space',
						type: 'options',
						typeOptions: {
							loadOptionsMethod: 'getSpaces',
						},
						default: '',
						description:
							'The space in which this memo is placed. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
						displayName: 'Attachments',
						name: 'attachments',
						type: 'string',
						default: '',
						placeholder: '123, 456 or attachments/123',
						description: 'Comma-separated list or JSON array of attachment IDs or names to link',
					},
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
						displayName: 'Space Name or ID',
						name: 'space',
						type: 'options',
						typeOptions: {
							loadOptionsMethod: 'getSpaces',
						},
						default: '',
						description:
							'The space in which this memo is placed. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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

	methods = {
		loadOptions: {
			async getSpaces(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const spaces = await apiRequestAllItems.call(this, 'spaces', 'GET', 'spaces');
				return [{name: 'No Space', value: ''},...(spaces as Array<{ name: string; title?: string; description?: string }>).map((space) => ({
					name: space.title || space.name,
					value: space.name,
					description: space.description,
				}))];
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'attachment') {
					if (operation === 'create') {
						const binaryData = this.getNodeParameter('binaryData', i, false) as boolean;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
						const body: IDataObject = {};

						if (binaryData) {
							const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i, 'data') as string;
							const itemBinary = this.helpers.assertBinaryData(i, binaryPropertyName);
							const dataBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
							body.content = dataBuffer.toString('base64');
							body.filename = (additionalFields.filename as string) || itemBinary.fileName || 'file';
							body.type = (additionalFields.type as string) || itemBinary.mimeType || 'application/octet-stream';
						} else {
							body.filename = this.getNodeParameter('filename', i) as string;
							if (additionalFields.filename) {
								body.filename = additionalFields.filename as string;
							}
							if (additionalFields.content) {
								body.content = additionalFields.content as string;
							}
							if (additionalFields.type) {
								body.type = additionalFields.type as string;
							}
						}

						if (additionalFields.externalLink) {
							body.externalLink = additionalFields.externalLink as string;
						}

						if (additionalFields.memo) {
							let memo = (additionalFields.memo as string).trim();
							if (memo && !memo.includes('/')) {
								memo = `memos/${memo}`;
							}
							body.memo = memo;
						}

						const responseData = await apiRequest.call(this, 'POST', 'attachments', body);
						returnData.push({
							json: responseData as IDataObject,
							pairedItem: { item: i },
						});
					} else if (operation === 'delete') {
						let attachmentId = this.getNodeParameter('attachmentId', i) as string;
						if (!attachmentId.includes('/')) {
							attachmentId = `attachments/${attachmentId}`;
						}

						await apiRequest.call(this, 'DELETE', attachmentId);
						returnData.push({
							json: { success: true },
							pairedItem: { item: i },
						});
					} else if (operation === 'get') {
						let attachmentId = this.getNodeParameter('attachmentId', i) as string;
						if (!attachmentId.includes('/')) {
							attachmentId = `attachments/${attachmentId}`;
						}

						const responseData = await apiRequest.call(this, 'GET', attachmentId);
						returnData.push({
							json: responseData as IDataObject,
							pairedItem: { item: i },
						});
					} else if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i) as IDataObject;
						const qs: IDataObject = {};

						if (filters.filter) {
							qs.filter = filters.filter;
						}
						if (filters.orderBy) {
							qs.orderBy = filters.orderBy;
						}

						if (returnAll) {
							const attachments = await apiRequestAllItems.call(this, 'attachments', 'GET', 'attachments', {}, qs);
							for (const attachment of attachments) {
								returnData.push({
									json: attachment,
									pairedItem: { item: i },
								});
							}
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							qs.pageSize = limit;
							const responseData = await apiRequest.call(this, 'GET', 'attachments', {}, qs);
							const attachments = ((responseData.attachments || []) as IDataObject[]).slice(0, limit);
							for (const attachment of attachments) {
								returnData.push({
									json: attachment,
									pairedItem: { item: i },
								});
							}
						}
					} else if (operation === 'update') {
						let attachmentId = this.getNodeParameter('attachmentId', i) as string;
						if (!attachmentId.includes('/')) {
							attachmentId = `attachments/${attachmentId}`;
						}

						const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
						const body: IDataObject = { ...updateFields };

						if (body.memo !== undefined) {
							let memo = (body.memo as string).trim();
							if (memo && !memo.includes('/')) {
								memo = `memos/${memo}`;
							}
							body.memo = memo;
						}

						const fieldKeys = Object.keys(body);
						if (fieldKeys.length === 0) {
							throw new NodeOperationError(this.getNode(), 'Please specify at least one field to update', {
								itemIndex: i,
							});
						}

						const qs: IDataObject = {
							updateMask: fieldKeys.join(','),
						};

						const responseData = await apiRequest.call(this, 'PATCH', attachmentId, body, qs);
						returnData.push({
							json: responseData as IDataObject,
							pairedItem: { item: i },
						});
					}
				} else if (resource === 'memo') {
					if (operation === 'create') {
						const content = this.getNodeParameter('content', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

						const body: IDataObject = {
							content,
							...additionalFields,
						};

						if (additionalFields.attachments !== undefined && additionalFields.attachments !== '') {
							body.attachments = formatAttachmentReferences(additionalFields.attachments);
						}

						if (body.space && typeof body.space === 'string' && !body.space.includes('/')) {
							body.space = `spaces/${body.space}`;
						}
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
						const body: IDataObject = { ...updateFields };

						if (body.attachments !== undefined) {
							body.attachments = formatAttachmentReferences(body.attachments);
						}

						if (
							body.space &&
							typeof body.space === 'string' &&
							!body.space.includes('/')
						) {
							body.space = `spaces/${body.space}`;
						}

						const fieldKeys = Object.keys(body);

						if (fieldKeys.length === 0) {
							throw new NodeOperationError(this.getNode(), 'Please specify at least one field to update', {
								itemIndex: i,
							});
						}

						const qs: IDataObject = {
							updateMask: fieldKeys.join(','),
						};

						const responseData = await apiRequest.call(this, 'PATCH', memoId, body, qs);
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
