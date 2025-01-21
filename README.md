# SPDocs

SPDocs is a real-time collaborative document editor built using React and Firebase. It allows multiple users to edit the same document concurrently. The project leverages Firebase Firestore for persistence and for real-time collaboration.

## Features

- Real-time collaborative editing
- User roles (owner, editor, viewer)
- Invite collaborators via email
- Real-time updates using Firebase Firestore

## Installation

To get started with the project, follow these steps:

1. Clone the repository:

   ```sh
   git clone https://github.com/SeanP1tt/collabdoc.git
   cd collabdoc
   ```

2. Install the dependencies:

```sh
   npm install
```

3. Set up Firebase:
   Create a Firebase project at Firebase Console.
   Add a web app to your Firebase project.
   Copy the Firebase configuration and create a `.env` file by replacing the placeholder values in `env.example` with your Firebase config variables.
4. Run the development server:
   ```sh
   npm start
   ```
5. Build the project for production

```sh
   npm run build
```

6. preview the production build

```sh
   npm run preview
```

Hosted Project
You can view the live version of the project at https://docsync-81b73.web.app/.

License
This project is licensed under the MIT License.
