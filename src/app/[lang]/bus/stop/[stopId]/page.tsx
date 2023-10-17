'use client';
import Fade from '@/components/Animation/Fade';
import GreenLineIcon from '@/components/BusIcons/GreenLineIcon';
import RedLineIcon from '@/components/BusIcons/RedLineIcon';
import supabase, { BusScheduleDefinition } from '@/config/supabase';
import { routes, stops } from '@/const/bus';
import useDictionary from '@/dictionaries/useDictionary';
import { useSettings } from '@/hooks/contexts/settings';
import { Button, Divider, LinearProgress } from '@mui/joy';
import { format, add, formatDistanceStrict } from 'date-fns';
import { enUS, zhTW } from 'date-fns/locale';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, MapPin } from 'react-feather';
import useSWR from 'swr'

type PageProps = {
    params: { stopId: string }
}
// route definition
// GU	A1U	A2U	A3U	A6U	A5U	A7D
// GUS	A2U	A3U	A6U	A5U	A7U	
// GD	A7D	A4D	A3D	A2D	A1D	
// GDS	A7D	A4D	A3D	A2D		
// RU	A1U	A2U	A3U	A4U	A7U	
// RUS	A2U	A3U	A4U	A7U		
// RD	A7U	A5D	A6D	A3D	A2D	
// RDS	A7U	A5D	A6D	A3D	A2D	A1D

type ScheduleItem = {
    arrival: Date;
    id: number;
    route_name: string | null;
    schedule: string[] | null;
    vehicle: string | null;
    route: typeof routes[0];
}

const BusStop = ({ params: { stopId } }: PageProps) => {
    const dict = useDictionary();
    const [date, setDate] = useState(new Date());
    const { language } = useSettings();

    const routesPassingStop = routes.filter(route => route.path.includes(stopId)).map(route => ({...route, stopIndex: route.path.indexOf(stopId)}));
    const routeCodes = routesPassingStop.map(route => route.code);

    const { data = [], error, isLoading } = useSWR(['bus_schedule', stopId], async ([table, stopId]) => {
        const { data: _data = [], error } = await supabase.from('bus_schedule').select('*').in('route_name', routeCodes);
        if(error) throw error;
        return _data;
    })

    const schedules = useMemo(() => data!.map(mod => {
        //get the time of arrival at this stop
        const route = routesPassingStop.find(route => route.code == mod.route_name)
        const time = mod.schedule![route!.stopIndex];
        return {...mod, arrival: new Date(format(date, "yyyy-MM-dd ") + time), route: route! }
    }).sort((a, b) => a.arrival.getTime() - b.arrival.getTime()), [data, date]);

    const stopDef = stops.find(stop => stopId.includes(stop.code));

    //update time every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setDate(new Date());
        }, 1 * 1000);
        return () => clearInterval(interval);
    }, []);

    const schedulesToDisplay = useMemo(() => 
        schedules.filter(mod => mod.arrival.getTime() > date.getTime()), 
    [schedules, date]);

    const getDisplayTime = (mod: ScheduleItem) => {
        if(mod.arrival.getTime() - date.getTime() > 30 * 60 * 1000) {
            return format(mod.arrival, 'HH:mm');
        } else if(mod.arrival.getTime() - date.getTime() < 60 * 1000) {
            return 'Arriving';
        } else {
            return formatDistanceStrict(mod.arrival, date, { locale: language == 'zh' ? zhTW: enUS });
        }
    }

    return <Fade>
        <div>
            {isLoading && <LinearProgress/>}
            <Button variant='plain' startDecorator={<ChevronLeft/>} onClick={() => history.back()}>Back</Button>
            <div className='flex flex-row gap-4 items-center px-6 py-4'>
                <MapPin/>
                <div className="flex flex-col">
                    <span className="text-lg font-bold">{stopDef?.name_zh} {stopId.endsWith('U') ? "上山": "下山"}</span>
                    <span className="text-xs">{stopDef?.name_en} - {stopId.endsWith('U') ? "Up": "Down"}</span>
                </div>
                <p className='text-right flex-1'>
                    Now: {format(date, 'HH:mm')}
                </p>
            </div>
            <Divider/>
            <div className='flex flex-col divide-y divide-gray-200 dark:divide-neutral-800'>
                {schedulesToDisplay.length == 0 && <div className='text-center text-gray-500 py-4'>No buses scheduled for today</div>}
                {schedulesToDisplay.map(mod => 
                <Link key={mod.id} href={`/${language}/bus/bus/${mod.id}`}>
                    <div key={mod.id} className='grid grid-cols-[50px_auto_102px] px-2 py-2'>
                        <div className='px-3 py-1'>
                            {mod.route_name?.startsWith('G') ? <GreenLineIcon/>: <RedLineIcon/>}
                        </div>
                        <div className='flex flex-col px-2 pt-1'>
                            <h4 className='font-bold'>{language == 'zh' ? mod.route.title_zh: mod.route.title_en}</h4>
                            <h5 className='text-sm text-gray-500'>Scheduled</h5>
                        </div>
                        <p className="font-semibold text-end pr-3 self-center">
                        {getDisplayTime(mod)}
                        </p>
                    </div>
                </Link>)}
            </div>
        </div>
    </Fade>
}

export default BusStop;