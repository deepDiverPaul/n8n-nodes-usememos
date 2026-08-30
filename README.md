# n8n-nodes-usememos

This is an n8n community node package that lets you integrate with [useMemos](https://usememos.com) in your [n8n](https://n8n.io/) workflows.

[useMemos](https://usememos.com) is an open-source, privacy-first, lightweight note-taking service. This node package allows you to create, manage, and retrieve memos and users, as well as trigger workflows based on Memos events via webhooks.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

* [Installation](#installation)
* [Operations](#operations)
* [Credentials](#credentials)
* [Compatibility](#compatibility)
* [Usage](#usage)
* [Resources](#resources)
* [Version history](#version-history)

---

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Community Nodes (Recommended)
1. Go to **Settings > Community Nodes** in your n8n instance.
2. Select **Install a community node**.
3. Enter `n8n-nodes-usememos` into the **npm Package Name** field.
4. Agree to the risks of using community packages and select **Install**.

### Manual Installation (Self-Hosted / Docker)
For Docker-based deployments, you can add `n8n-nodes-usememos` to your custom image or install it in your `~/.n8n/custom` directory:

```bash
npm install n8n-nodes-usememos
```

---

## Operations

This package provides two nodes: the **Memos** action node and the **Memos Trigger** webhook node.

### 1. Memos Node (`Memos`)

Interact with resources in your Memos instance. Also supports AI Tool calling (`usableAsTool`).

#### Memo Resource
- **Create**: Create a new memo in Markdown format.
  - **Content**: Markdown body of the memo.
  - **Visibility**: Set visibility (`PRIVATE`, `PROTECTED`, or `PUBLIC`).
  - **State**: Set state (`NORMAL` or `ARCHIVED`).
  - **Pinned**: Choose whether the memo is pinned.
- **Get**: Retrieve a specific memo by ID or resource name (e.g., `123` or `memos/123`).
- **Get Many**: List multiple memos with flexible querying.
  - **Return All** or specify a **Limit**.
  - **State**: Filter by state (`NORMAL` or `ARCHIVED`).
  - **Filter**: CEL (Common Expression Language) filter expression (e.g., `creator == "users/1"`).
  - **Order By**: Sort order (e.g., `display_time desc`, `create_time desc`).
- **Update**: Modify an existing memo by ID or name using update masks.
  - Update **Content**, **Visibility**, **State**, or **Pinned** status.
- **Delete**: Delete an existing memo by ID or name.

#### User Resource
- **Get**: Retrieve user profile and details by user ID or username.
- **Get Many**: List users with pagination (`Return All` or set a `Limit`).
- **Get Current User**: Fetch profile and session details for the authenticated user (`/auth/me`).

---

### 2. Memos Trigger Node (`Memos Trigger`)

A webhook trigger node that automatically subscribes to and receives event notifications from a Memos instance via webhook callbacks (`/api/v1/webhooks`).

- Automatically creates and manages webhooks when workflow is activated.
- Captures real-time event payloads sent from Memos to trigger workflows instantly.

---

## Credentials

To use these nodes, you need to configure the **Memos API** (`memosApi`) credential with your Memos instance details.

### Prerequisites
1. A running useMemos instance (self-hosted or cloud-hosted).
2. An account on your Memos instance.

### Obtaining an Access Token
1. Log in to your Memos web interface.
2. Go to **Settings > Access Tokens**.
3. Click **Create Access Token**, specify a description and expiration, and copy the generated token.

### Setting Up Credentials in n8n
1. In n8n, create a new credential for **Memos API**.
2. Configure the following fields:
   - **Server URL**: The base URL of your Memos instance (e.g., `https://memos.example.com`).
   - **Access Token**: The personal access token generated in Memos.
3. Save the credential. n8n will test authentication via `POST /api/v1/auth/status`.

---

## Compatibility

- **n8n**: Tested with n8n version `1.0.0` and above.
- **useMemos API**: Compatible with useMemos REST API v1.

---

## Usage

### Example Workflows

- **Automated Note Logging**: Forward messages from Slack, Discord, Telegram, or Email to Memos to maintain an inbox of quick notes.
- **Daily Digest / Summary**: Fetch all memos created today using CEL filters (e.g., `create_time > '2026-08-30T00:00:00Z'`), generate a summary with an LLM, and send an email report.
- **AI Agent Tool**: Use the Memos node as an AI tool inside n8n's Advanced AI Agent workflows so the agent can read and write notes to your knowledge base.
- **Webhook Automation**: Trigger automated task creation or backups whenever a new memo is published.

---

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [useMemos Official Website](https://usememos.com)
* [useMemos API Reference](https://usememos.com/docs/api/latest)
* [useMemos Access Tokens Guide](https://usememos.com/docs/security/access-tokens)
* [useMemos GitHub Repository](https://github.com/usememos/memos)

---

## Version history

### 0.1.0
- Initial release of the `n8n-nodes-usememos` community node package.
- Support for **Memo** resource: Create, Get, Get Many, Update, and Delete.
- Support for **User** resource: Get, Get Many, and Get Current User (`auth/me`).
- Support for **Memos Trigger** webhook node.
