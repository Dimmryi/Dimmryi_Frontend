import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IFilterMapState {
    listingType: string;
    rangeValue: number;
    destination: string;
    propertyType: string;
}

const initialState: IFilterMapState = {
    destination: '',
    rangeValue: 20,
    listingType: '',
    propertyType: '',
};

export const filterMapSlice = createSlice({
    name: 'filterMap',
    initialState,
    reducers: {
        setFilterFeatures: (state, action: PayloadAction<Partial<IFilterMapState>>) => {
            return { ...state, ...action.payload };
        },
        resetMapFilter: () => initialState,
    },
});

export const { setFilterFeatures, resetMapFilter } = filterMapSlice.actions;
export default filterMapSlice.reducer;
