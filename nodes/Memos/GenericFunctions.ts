import {
	IAllExecuteFunctions,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
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
	this: IAllExecuteFunctions | IExecuteFunctions | IHookFunctions,
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
	this: IExecuteFunctions,
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
	if (user.name) {
		return user.name.startsWith('users/') ? user.name : `users/${user.name}`;
	}
	if (user.id !== undefined) {
		return `users/${user.id}`;
	}
	if (user.username) {
		return `users/${user.username}`;
	}
	throw new Error('Could not determine user identifier from current user response');
}
