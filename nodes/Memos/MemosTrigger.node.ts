/* eslint-disable n8n-nodes-base/node-class-description-icon-not-svg */
import {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	JsonObject,
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';
import { apiRequest } from './GenericFunctions';
import { WebhookModel } from './Interfaces';

export class MemosTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Memos Trigger',
		name: 'memosTrigger',
		icon: 'file:memos.png',
		group: ['trigger'],
		version: 1,
		subtitle: 'Webhook',
		description: 'Handle Memos events via webhooks',
		defaults: {
			name: 'Memos Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'memosApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.webhookId === undefined) {
					return false;
				}

				let endpoint = `webhooks/${webhookData.webhookId}`;
				if (String(webhookData.webhookId).startsWith('webhooks/')) {
					endpoint = String(webhookData.webhookId);
				}

				try {
					const webhook = (await apiRequest.call(this, 'GET', endpoint)) as unknown as WebhookModel;
					if (webhook && webhook.url === webhookUrl) {
						return true;
					}
					delete webhookData.webhookId;
					return false;
				} catch {
					delete webhookData.webhookId;
					return false;
				}
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;

				if (webhookUrl.includes('//localhost')) {
					throw new NodeOperationError(
						this.getNode(),
						'The Webhook cannot work on "localhost". Please configure n8n on a reachable domain or use tunnel mode (--tunnel)!',
					);
				}

				const endpoint = 'webhooks';
				const body = {
					name: 'Memos Trigger',
					url: webhookUrl,
				};
				const webhookData = this.getWorkflowStaticData('node');
				try {
					const responseData = (await apiRequest.call(this, 'POST', endpoint, body)) as unknown as WebhookModel;
					webhookData.webhookId = responseData.id || responseData.name;
					return true;
				} catch (error) {
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.webhookId === undefined) {
					return true;
				}

				let endpoint = `webhooks/${webhookData.webhookId}`;
				if (String(webhookData.webhookId).startsWith('webhooks/')) {
					endpoint = String(webhookData.webhookId);
				}

				try {
					await apiRequest.call(this, 'DELETE', endpoint);
				} catch (error) {
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
				delete webhookData.webhookId;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData() as IDataObject;

		return {
			workflowData: [this.helpers.returnJsonArray([bodyData])],
		};
	}
}
