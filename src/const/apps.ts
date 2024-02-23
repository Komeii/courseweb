import { AlertOctagon, Store, Bus, Car, Clipboard, Club, CreditCard, MapPin, Network, WalletCards} from 'lucide-react';

export const apps = [
    {
        id: 'venues',
        title_zh: '地點',
        title_en: 'Venues',
        href: '/venues',
        Icon: MapPin,
    },
    {
        id: 'bus',
        title_zh: '公車',
        title_en: 'Bus',
        href: '/bus',
        Icon: Bus,
    },
    {
        id: 'shops',
        title_zh: '餐廳及服務',
        title_en: 'Shops',
        href: '/shops',
        Icon: Store,
    },
    // {
    //     id: 'student_card',
    //     title_zh: '學生證',
    //     title_en: 'Student Card',
    //     href: '/student',
    //     Icon: WalletCards,
    //     auth: true,
    // },
    // {
    //     id: 'working_hours',
    //     title_zh: '工讀',
    //     title_en: 'Working Hours',
    //     href: '/ais-redirect/PE/1/14D/PE14D1.php',
    //     Icon: Bus,
    //     target: '_blank',
    // },
    {
        id: 'grades',
        title_zh: '你的成績',
        title_en: 'Your Grades',
        href: '/student/grades',
        Icon: Clipboard,
        ais: true,
    },
    {
        id: 'reach',
        title_zh: '校園通報網',
        title_en: 'Campus Defect Report',
        href: '/ais-redirect/SSO_LINK/campusnotice.php',
        Icon: AlertOctagon,
        target: '_blank',
        ais: true,
    },
    {
        id: 'park',
        title_zh: '駐警隊車輛辦證系統',
        title_en: 'Vehicle Registration System',
        href: '/ais-redirect/SSO_LINK/park.php',
        Icon: Car,
        target: '_blank',
        ais: true,
    },
    {
        id: 'card',
        title_zh: '校園電子票證掛失/補發/密碼變更系統',
        title_en: 'Student ID Management',
        href: '/ais-redirect/SSO_LINK/card.php',
        Icon: CreditCard,
        target: '_blank',
        ais: true,
    },
    {
        id: 'nthuclub',
        title_zh: '清大社團管理系統',
        title_en: 'NTHU Clubs',
        href: '/ais-redirect/SSO_LINK/nthuclub.php',
        Icon: Club,
        target: '_blank',
        ais: true,
    },
    {
        id: 'netsys',
        title_zh: '網路系統組線上服務',
        title_en: 'Network System Services',
        href: '/ais-redirect/netsys.php',
        Icon: Network,
        target: '_blank',
        ais: true,
    }
]