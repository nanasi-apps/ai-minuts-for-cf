# API Documentation

## Authentication (Google OAuth)

### Login
- **URL**: `/auth/google/login`
- **Method**: `GET`
- **Description**: Redirects the user to Google's OAuth 2.0 login page.

### Callback
- **URL**: `/auth/google/callback`
- **Method**: `GET`
- **Description**: Handles the callback from Google.
    - Creates or updates the user.
    - Creates a session token (JWT) and sets it as a cookie (`session_token`).
    - **Auto-join**: If the user's email domain matches an organization's `allowedDomains`, the user is automatically added to that organization as a MEMBER.

## Workspace (Organization) API

These endpoints are available via the `orpc` client.

### List Organizations
- **Procedure**: `organizations.list`
- **Input**: None
- **Output**:
  ```json
  [
    {
      "id": 1,
      "name": "My Organization",
      "slug": "my-org",
      "role": "OWNER"
    }
  ]
  ```

### Get Organization
- **Procedure**: `organizations.get`
- **Input**: `{ "slug": "my-org" }`
- **Output**:
  ```json
  {
    "id": 1,
    "name": "My Organization",
    "slug": "my-org",
    "allowedDomains": "example.com",
    "role": "OWNER",
    "members": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "OWNER",
        "avatarUrl": "..."
      }
    ]
  }
  ```

### Create Organization
- **Procedure**: `organizations.create`
- **Input**:
  ```json
  {
    "name": "New Org",
    "slug": "new-org"
  }
  ```
- **Output**: Organization details.

### Update Organization
- **Procedure**: `organizations.update`
- **Input**:
  ```json
  {
    "id": 1,
    "name": "Updated Name",
    "allowedDomains": "example.com, other.com"
  }
  ```
- **Output**: Updated organization details.
- **Note**: Only `OWNER` can update.

### Invite Member
- **Procedure**: `organizations.invite`
- **Input**:
  ```json
  {
    "organizationId": 1,
    "email": "invitee@example.com",
    "role": "MEMBER"
  }
  ```
- **Output**: Invitation token.

### Add Admin
- **Procedure**: `organizations.addAdmin`
- **Input**:
  ```json
  {
    "organizationId": 1,
    "userId": 2
  }
  ```
- **Output**: Updated member role.
