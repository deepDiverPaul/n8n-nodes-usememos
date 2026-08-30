import { AllEntities, IDataObject, PropertiesOf } from 'n8n-workflow';

export type MemosMap = {
	memo: 'create' | 'delete' | 'get' | 'getAll' | 'update';
	user: 'get' | 'getAll' | 'getMe';
};

export type MemosAction = AllEntities<MemosMap>;
export type MemosProperties = PropertiesOf<MemosAction>;

export type RowStatus = 'ACTIVE' | 'ARCHIVED' | 'ROW_STATUS_UNSPECIFIED';
export type MemoState = 'STATE_UNSPECIFIED' | 'NORMAL' | 'ARCHIVED';
export type UserRole = 'ROLE_UNSPECIFIED' | 'HOST' | 'ADMIN' | 'USER';
export type Visibility = 'VISIBILITY_UNSPECIFIED' | 'PRIVATE' | 'PROTECTED' | 'PUBLIC';

export interface ResourceModel {
	name: string;
	uid?: string;
	createTime?: string;
	filename?: string;
	content?: string;
	externalLink?: string;
	type?: string;
	size?: string;
	memo?: string;
}

export interface UserModel {
	user: {
		name: string;
		id?: number;
		role?: UserRole;
		username?: string;
		email?: string;
		nickname?: string;
		displayName?: string;
		avatarUrl?: string;
		description?: string;
		password?: string;
		rowStatus?: RowStatus;
		state?: MemoState;
		createTime?: string;
		updateTime?: string;
	}
}

export interface Memo {
	name: string;
	uid?: string;
	rowStatus?: RowStatus;
	state?: MemoState;
	creator?: string;
	createTime?: string;
	updateTime?: string;
	displayTime?: string;
	content: string;
	nodes?: IDataObject[];
	visibility?: Visibility;
	tags?: string[];
	pinned?: boolean;
	resources?: ResourceModel[];
	attachments?: IDataObject[];
	relations?: IDataObject[];
	reactions?: IDataObject[];
	property?: {
		tags?: string[];
		hasLink?: boolean;
		hasTaskList?: boolean;
		hasCode?: boolean;
		hasIncompleteTasks?: boolean;
	};
}

export interface WebhookModel {
	name?: string;
	url?: string;
	displayName?: string;
	createTime?: string;
	updateTime?: string;
	signingSecret?: string;
	signingSecretSet?: boolean;
	id?: number | string;
	creatorId?: number;
	rowStatus?: RowStatus;
}

export interface ListUserWebhooksResponse {
	webhooks?: WebhookModel[];
}

export interface WebhookPayload {
	url?: string;
	activityType?: string;
	creatorId?: number;
	createTime?: string;
	memo?: Memo;
}
