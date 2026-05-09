export interface GoogleContact {
  name: string;
  email: string;
  phone: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

function loadGIS(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

export async function importGoogleContacts(): Promise<GoogleContact[]> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId || clientId === "your_google_client_id_here") {
    throw new Error(
      "Google Client ID is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env file."
    );
  }

  await loadGIS();

  const token = await new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/contacts.readonly",
      callback: (response) => {
        if (response.error) {
          reject(new Error(`Google OAuth error: ${response.error}`));
        } else if (response.access_token) {
          resolve(response.access_token);
        } else {
          reject(new Error("No access token returned"));
        }
      },
    });
    client.requestAccessToken();
  });

  const res = await fetch(
    "https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=100",
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch contacts: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  const contacts: GoogleContact[] = (data.connections || [])
    .filter((c: any) => c.names && c.names.length > 0)
    .map((c: any) => ({
      name: c.names[0].displayName,
      email: c.emailAddresses?.[0]?.value || "",
      phone: c.phoneNumbers?.[0]?.value || "",
    }))
    .filter((c: GoogleContact) => c.name);

  return contacts;
}
