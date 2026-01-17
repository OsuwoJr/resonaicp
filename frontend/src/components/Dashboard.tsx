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

    switch (role._tag) {
        case 'artist':
            return <ArtistDashboard userProfile={userProfile} />;
        case 'buyer':
            return <BuyerDashboard userProfile={userProfile} />;
        case 'hub':
            return <HubDashboard userProfile={userProfile} />;
        case 'admin':
            return <AdminDashboard userProfile={userProfile} />;
        default:
            return <div>Unknown role</div>;
    }
}
