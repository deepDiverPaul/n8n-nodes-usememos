import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class MemosApi implements ICredentialType {
	name = 'memosApi';
	displayName = 'Memos API';
	documentationUrl = 'https://usememos.com/docs/security/access-tokens';
	icon = 'file:memos.png' as const;
	properties: INodeProperties[] = [
		{
			displayName: 'Server URL',
			name: 'server',
			type: 'string',
			default: '',
			placeholder: 'https://memos.example.com',
			required: true,
			description: 'The URL of your Memos instance',
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'The access token created in your Memos account settings',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.server}}/api/v1',
			url: '/auth/status',
			method: 'POST',
		},
	};
}
