import 'dotenv/config';
const EVENT_SERVICE_URL = process.env.EVENT_SERVICE_URL || 'http://localhost:5003';

export interface SeatData {
    id: string;
    eventId: string;
    seatNumber: string;
    seatIndex: number;
    priceInPaise: number;
    status: 'available' | 'locked' | 'booked';
    createdAt: string;
}

export const getSeat = async (seatId: string): Promise<SeatData | null> =>{
    const res = await fetch(`${EVENT_SERVICE_URL}/internal/seats/${seatId}`)
    if(res.status === 404) return null;
    if(!res.ok){
        throw new Error(`event-service returned ${res.status} while fetching seat`);
    }
    const data = await res.json();
    return data.seat;
};

export const updateSeat = async(
    seatId: string,
    status: 'available' | 'locked' | 'booked'
): Promise<SeatData | null> =>{
    const res = await fetch(`${EVENT_SERVICE_URL}/internal/seats/${seatId}` , {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });

    if(!res.ok){
        throw new Error(`event-service returned ${res.status} while updating seat`);
    }
    const data = await res.json();
    return data.seat;
};


