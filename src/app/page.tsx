import AuthScreen from "@/components/home/auth-screen/AuthScreen";
import HomeScreen from "@/components/home/home-screen/HomeScreen";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export default async function Home() {
	const { isAuthenticated } = getKindeServerSession();
	const isLoggedIn = await isAuthenticated();
	// const { getUser } = getKindeServerSession();
	// const user = await getUser();
	console.log(isLoggedIn);
	return <main>{isLoggedIn ? <HomeScreen /> : <AuthScreen />}</main>;
}
