# Flow State

The smallest React global state management library I could write with the features I wanted.

Heavily inspired by the simplicity of Galactic State and the convenient feature set of Zustand, RTK, and Recoil.

# Features

- Simple state container built around React hooks.
- Supports slice-based derived state out of the box.
- Supports shallow merge of object-based Flow State out of the box (can be overridden).
- Supports updating Flow State from anywhere in your app through the update function.
- Subscribe to changes to Flow State anywhere in your app via the subscribe function.
- Relies on `useSyncExternalStore` for consistency.
- Dependency-free other than React itself.
- Looks and feels like useState/useSelector/Zustand.
- Written in Typescript.

# Installation

```bash
npm install @flow-tools/flow-state
```

# Basic Usage

All you need to get started is to pass your initial state into createFlowStore.

```ts
// from any file...
import { createFlowStore } from '@flow-tools/flow-state';

// the createFlowStore function returns everything you need.
export const store = createFlowStore({
  user: { name: 'Jimmy Bananas', age: 34 },
  description: 'A swell dude.',
});
```

Optionally, you can always write any custom logic, name your exports, etc. World's your oyster.

```ts
import { createFlowStore } from '@flow-tools/flow-state';

const userStore = createFlowStore({
  user: { name: 'Jimmy Bananas', age: 34 },
  description: 'A good dude, that Jimmy.',
});

const logValOnChange = (value) => {
  console.log('VALUE!', value);
};
const unsubscribe = userStore.subscribe(logValOnChange);

export const {
  useFlowState: useUserState,
  useFlowSelector: useUserSelector,
  update: updateUser,
} = userStore;
```

Grab the full state, and go buck-wild.

```ts
import { useUserState } from '../userStore';

// in your component
const [userProfile, setUserProfile] = useUserState();

// will preserve the description state from above via shallow merge.
setUserProfile({ user: { name: 'Jimmy B', age: 34 } }); // shallow merge.
setUserProfile({ user: { name: 'Jimmy Bananas', age: 32 } }); // shallow merge.
setUserProfile({ meh: {} }, true); // full state replacement. Removes description, user, etc. Just have meh now.
```

Grab a slice of state, which will optimize your renders for you, and also go buck-wild. For more details, see the API docs below.

```ts
import { useUserSelector } from '../userStore';

// Note - this is the same state set function that is given to you from the full state hook.
const [userDescription, setUserProfile] = useUserSelector(
  (state) => state.description
);

// You can also return partial state, to be shallow merged.
setUserProfile((state) => {
  if (state.user.age > 30) {
    return { description: 'Jimmy is a millennial!' };
  }
  return state;
});
```

And in a file, a million miles away -

```ts
import { updateUser } from '../userStore';

updateUser.subscribe(logDataOrSomething);

const randomUpdateFunction = async (params) => {
  const data = await fetchData(params);
  if (data.error)
    updateUser((state) => {
      /* do some stuff*/
    });
};
```

It's that easy. You want less? Take less. You want more? Take it all.
You want middleware options? Ad-hoc subscriptions? Custom functionality written for each piece of state you declare? Have it.

# API

### createFlowState(init)

Creates a new store.
Returns:

- **useFlowState(): [T, update]** - React hook to get the full Flow State and updater function. Works just like useState, but with shallow merging.
- **useFlowSelector(selector): [U, update]** - React hook to get a slice of Flow State. Takes a selector function similar to RTK. Note - if the slice of state doesn't change, the component doesn't re-render. The update function is the same as the useFlowState above.
- **update(partialOrFn, replace = false)** - Updates Flow State. If the new state changed, notify is called and all listeners are handed the new fully formed Flow State.
  - If partialOrFn is a function, the full Flow State is passed in and the result is shallow merged with the current Flow State.
  - If partialOrFn is an object, it is shallow merged with the current Flow State.
  - If the partialOrFn is not an object, the Flow State is directly replaced.
  - If replace is true, then the Flow State is directly replaced.
- **getState** - Returns the current Flow State.
- **getInit** - Returns the initial Flow State.
- **subscribe** - Subscribes a function to Flow State changes. Returns an unsubscribe function.
- **unsubscribe** - Unsubscribes a given function from the Flow State.
- **unsubscribeAll** - Unsubscribes all listeners from the Flow State.
- **notify** - Calls all listener callbacks with the Flow State. Note, you can manually pass in a value that will then get handed to all of the listeners, but it will not set the Flow State with that value.
- **resetState** - Resets the Flow State to the original value.

# Additional Notes

- The shallow merge functionality works just like Zustand, and only on objects. All other data types will be simply replaced.
- The useFlowSelector hook returns the full state update function. You update the your slice by updating the full Flow State object itself - then the slice value naturally updates, and all subscribers are notified.
- If the full Flow State object is modified, but your slice returns the same value or composite data type in memory, it will _not_ re-render your component.
