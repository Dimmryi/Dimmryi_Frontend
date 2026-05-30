import type { RootState } from '../../store/store';
import { useSelector, useDispatch } from 'react-redux';
import { decrement, increment, incrementByAmount } from './counterSlice';

function Counter() {
    const count = useSelector((state: RootState) => state.counter.value);
    const dispatch = useDispatch();

    return (
        <div>
            <div>
                <button
                    aria-label="Increment value"
                    onClick={() => dispatch(increment())}
                >
                    Increment
                </button>
                <span>{count}</span>
                <button
                    aria-label="Decrement value"
                    onClick={() => dispatch(decrement())}
                >
                    Decrement
                </button>
                <span>{count}</span>
                <button
                    aria-label="IncrementByAmount value"
                    onClick={() => dispatch(incrementByAmount(2))}
                >
                    IncrementByAmount
                </button>
            </div>
        </div>
    );
}

export default Counter;
