import { UserProfile, AppRole } from '../backend';
import ArtistDashboard from './dashboards/ArtistDashboard';
import BuyerDashboard from './dashboards/BuyerDashboard';
import HubDashboard from './dashboards/HubDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

interface DashboardProps {
    userProfile: UserProfile;
}

export default function Dashboard({ userProfile }: DashboardProps) {
    const role = userProfile.appRole;

    switch (role) {
        case AppRole.artist:
            return <ArtistDashboard userProfile={userProfile} />;
        case AppRole.buyer:
            return <BuyerDashboard userProfile={userProfile} />;
        case AppRole.hub:
            return <HubDashboard userProfile={userProfile} />;
        case AppRole.admin:
            return <AdminDashboard userProfile={userProfile} />;
        default:
            return <div>Unknown role</div>;
    }
}
