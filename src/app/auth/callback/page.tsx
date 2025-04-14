"use client";
import { Loader } from "lucide-react";
import { checkAuthStatus } from "./actions";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

const Page = () => {
    const router = useRouter();
    // Get Kinde user status on client - useful for Stripe check later
    const { user: kindeUser, isLoading: checkingKindeAuth } = useKindeBrowserClient();

    // State to track if the server-side DB sync is complete and successful
    const [syncStatus, setSyncStatus] = useState<{ loading: boolean; success: boolean | null; error: string | null }>({
        loading: true,
        success: null,
        error: null,
    });

    // Effect 1: Trigger the server-side DB sync ONCE on mount
    useEffect(() => {
        const syncUser = async () => {
            try {
                const result = await checkAuthStatus(); // Call the action
                setSyncStatus({ loading: false, success: result.success, error: result.error || null });
            } catch (err: any) {
                console.error("Error calling ensureUserSynced action:", err);
                setSyncStatus({ loading: false, success: false, error: err.message || "Action failed" });
            }
        };
        syncUser();
    }, []); // Empty dependency array: run only once

	// Effect 2: Handle redirects AFTER sync is complete and Kinde client status is known
    useEffect(() => {
        // Don't do anything until BOTH the DB sync AND Kinde client checks are done loading
        if (syncStatus.loading || checkingKindeAuth) {
            return;
        }

        // Handle DB Sync Failure
        if (syncStatus.success === false) {
            console.error("DB Sync failed:", syncStatus.error);
            // Redirect to an error page or back to login
            router.push("/?error=" + (syncStatus.error || "dbsync_failed"));
            return;
        }

        // --- At this point, syncStatus.success === true ---
        // Now, run the Stripe check logic

        const stripeUrl = localStorage.getItem("stripeRedirectUrl");
        if (stripeUrl && kindeUser?.email) { // Check kindeUser obtained from client hook
            console.log("Redirecting to Stripe URL:", stripeUrl);
            localStorage.removeItem("stripeRedirectUrl");
            window.location.href = stripeUrl + "?prefilled_email=" + kindeUser.email;
            // window.location stops further execution
            return;
        }


        if (kindeUser) {
             console.log("Redirecting to default destination (e.g., dashboard)");
             router.push("/secret-dashboard");
        } else {
             console.warn("DB Sync succeeded but Kinde client user not found? Redirecting home.");
             router.push("/");
        }

    // Depend on sync status AND Kinde client status
    }, [syncStatus, checkingKindeAuth, kindeUser, router]);


    // --- Render loading state ---
    // Show loading while DB sync OR Kinde client check is in progress
    if (syncStatus.loading || checkingKindeAuth) {
        return (
            <div className='mt-20 w-full flex justify-center'>
                <div className='flex flex-col items-center gap-2'>
                    <Loader className='w-10 h-10 animate-spin text-muted-foreground' />
                    <h3 className='text-xl font-bold'>Verifying Session...</h3>
                    <p>Please wait...</p>
                </div>
            </div>
        );
    }

	return (
		<div className='mt-20 w-full flex justify-center'>
			<div className='flex flex-col items-center gap-2'>
				<Loader className='w-10 h-10 animate-spin text-muted-foreground' />
				<h3 className='text-xl font-bold'>Redirecting...</h3>
				<p>Please wait...</p>
			</div>
		</div>
	);
};
export default Page;
