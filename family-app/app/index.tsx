import { Redirect } from 'expo-router';
// Tabs live in app/tabs (a plain folder, so URLs are /tabs/...). Renaming it to a route group "(tabs)" also works.
export default function Index() { return <Redirect href="/tabs" />; }
