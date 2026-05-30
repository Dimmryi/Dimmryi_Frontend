import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface INotificationState {
    listingType: string;
    propertyType: string;
    typeOfNovelty: string;
    minNumbersOfRoom: number;
    maxNumbersOfRoom: number;
    minTotalArea: number;
    maxTotalArea: number;
    minFloor: number;
    maxFloor: number;
    minPrice: number;
    maxPrice: number;
    location: string;
    locationRange: number;
    email: string;
}

const initialState: INotificationState = {
    listingType: '',
    propertyType: '',
    typeOfNovelty: '',
    minNumbersOfRoom: 0,
    maxNumbersOfRoom: 0,
    minTotalArea: 0,
    maxTotalArea: 0,
    minFloor: 0,
    maxFloor: 0,
    minPrice: 0,
    maxPrice: 0,
    location: '',
    locationRange: 10,
    email: '',
};

export const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
        setNotificationProperty: (state, action: PayloadAction<Partial<INotificationState>>) => {
            return { ...state, ...action.payload };
        },
        resetNotificationProperty: () => initialState,
    },
});

export const { setNotificationProperty, resetNotificationProperty } = notificationSlice.actions;
export default notificationSlice.reducer;
