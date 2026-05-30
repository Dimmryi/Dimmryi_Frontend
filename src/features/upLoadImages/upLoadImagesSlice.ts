import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ImageState {
    images: string[];
}

const initialState: ImageState = {
    images: [],
};

export const upLoadImagesSlice = createSlice({
    name: 'upLoadImages',
    initialState,
    reducers: {
        addImage: (state, action: PayloadAction<{ index: number; url: string }>) => {
            if (action.payload.index >= state.images.length) {
                state.images.push(action.payload.url);
            } else {
                state.images[action.payload.index] = action.payload.url;
            }
        },
        removeImage: (state, action: PayloadAction<number>) => {
            state.images.splice(action.payload, 1);
        },
        clearImages: (state) => {
            state.images = [];
        },
        setImages: (state, action: PayloadAction<string[]>) => {
            state.images = action.payload.filter(
                (url) => typeof url === 'string' && url.startsWith('http')
            );
        },
    },
});

export const { addImage, removeImage, clearImages, setImages } = upLoadImagesSlice.actions;
export default upLoadImagesSlice.reducer;
