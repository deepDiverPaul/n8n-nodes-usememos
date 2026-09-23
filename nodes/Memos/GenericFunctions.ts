import {
	IAllExecuteFunctions,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IDataObject,
	JsonObject,
	NodeApiError,
} from 'n8n-workflow';
import { UserModel } from './Interfaces';

type MemosCredentials = {
	server: string;
	accessToken: string;
};

export async function apiRequest(
	this: IAllExecuteFunctions | IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IHttpRequestOptions['body'],
	query?: IHttpRequestOptions['qs'],
): Promise<IDataObject> {
	const credentials = (await this.getCredentials('memosApi')) as MemosCredentials;
	let serverUrl = (credentials.server || '').trim().replace(/\/+$/, '');
	if (!serverUrl.endsWith('/api/v1')) {
		serverUrl = `${serverUrl}/api/v1`;
	}

	if (!endpoint.startsWith('/')) {
		endpoint = `/${endpoint}`;
	}

	const options: IHttpRequestOptions = {
		url: endpoint,
		baseURL: serverUrl,
		headers: {
			'User-Agent': 'n8n',
		},
		method,
		body,
		qs: query,
		json: true,
	};

	try {
		return (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'memosApi',
			options,
		)) as IDataObject;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export async function apiRequestAllItems(
	this: IExecuteFunctions | ILoadOptionsFunctions | IAllExecuteFunctions | IHookFunctions,
	propertyName: string,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IHttpRequestOptions['body'] = {},
	query: IHttpRequestOptions['qs'] = {},
): Promise<IDataObject[]> {
	const returnData: IDataObject[] = [];
	let responseData;
	const qs = { ...query };

	do {
		responseData = await apiRequest.call(this, method, endpoint, body, qs);
		const items = responseData[propertyName];
		if (Array.isArray(items)) {
			returnData.push(...items);
		}
		const nextPageToken = responseData.nextPageToken;
		if (nextPageToken) {
			qs.pageToken = nextPageToken;
		} else {
			break;
		}
	} while (responseData.nextPageToken);

	return returnData;
}

export async function getCurrentUser(
	this: IAllExecuteFunctions | IExecuteFunctions | IHookFunctions,
): Promise<UserModel> {
	return (await apiRequest.call(this, 'GET', 'auth/me')) as unknown as UserModel;
}

export function getUserResourceName(user: UserModel): string {
	if (user.user.name) {
		return user.user.name.startsWith('users/') ? user.user.name : `users/${user.user.name}`;
	}
	if (user.user.username) {
		return `users/${user.user.username}`;
	}
	throw new Error('Could not determine user identifier from current user response');
}

export function formatAttachmentReferences(input: unknown): Array<{ name: string }> {
	if (!input) {
		return [];
	}

	if (typeof input === 'string') {
		const trimmed = input.trim();
		if (!trimmed) {
			return [];
		}

		if (trimmed.startsWith('[')) {
			try {
				const parsed = JSON.parse(trimmed) as unknown;
				return formatAttachmentReferences(parsed);
			} catch {
				// Fall through to comma-separated handling
			}
		}

		return trimmed
			.split(',')
			.map((item) => item.trim())
			.filter((item) => item.length > 0)
			.map((item) => ({
				name: item.includes('/') ? item : `attachments/${item}`,
			}));
	}

	if (Array.isArray(input)) {
		return input
			.map((item) => {
				if (typeof item === 'string') {
					const trimmed = item.trim();
					return trimmed.length > 0
						? { name: trimmed.includes('/') ? trimmed : `attachments/${trimmed}` }
						: null;
				}
				if (item && typeof item === 'object') {
					const obj = item as IDataObject;
					if (typeof obj.name === 'string') {
						const name = obj.name.trim();
						return {
							...obj,
							name: name.includes('/') ? name : `attachments/${name}`,
						};
					}
					if (obj.id !== undefined) {
						return { name: `attachments/${obj.id}` };
					}
				}
				return null;
			})
			.filter((item): item is { name: string } => item !== null);
	}

	return [];
}
