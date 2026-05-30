import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IFilterState {
    listingType: string;
    minPrice: string;
    maxPrice: string;
    novelty: string;
    propertyType: string;
}

const initialState: IFilterState = {
    listingType: '',
    minPrice: '0',
    maxPrice: '100000000',
    novelty: 'newToOld',
    propertyType: '',
};

export const filterSlice = createSlice({
    name: 'filter',
    initialState,
    reducers: {
        setFilterCriteria: (state, action: PayloadAction<Partial<IFilterState>>) => {
            return { ...state, ...action.payload };
        },
        resetFilter: () => initialState,
    },
});

export const { setFilterCriteria, resetFilter } = filterSlice.actions;
export default filterSlice.reducer;
