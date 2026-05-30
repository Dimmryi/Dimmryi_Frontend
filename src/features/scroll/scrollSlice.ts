import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ScrollState {
    y: number;
}

const initialState: ScrollState = {
    y: 0,
};

const scrollSlice = createSlice({
    name: 'scroll',
    initialState,
    reducers: {
        setScrollY(state, action: PayloadAction<number>) {
            state.y = action.payload;
        },
    },
});

export const { setScrollY } = scrollSlice.actions;
export default scrollSlice.reducer;
