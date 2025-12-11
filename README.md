# Flow State

The smallest React global state management library I could write with the features I wanted.

Heavily inspired by the simplicity of Galactic State, and the convenient feature set of Zustand and Recoil.

# Features

- Simple state container built around React hooks.
- Supports slice based state out of the box.
- Supports shallow merge of object-based state out of the box (can be overridden).
- Supports updating stateful values from anywhere in your app through the update function.
- Subscribe to changes anywhere in your app via the subscribe function.
- Relies on useSyncExternalStore for consistency.
- Dependency-free other than React itself.
- Looks and feels like useState/useSelector.
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

// the createFlowStore function return everything you need.
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
  description: 'A good dude, that Jimmy.'
});

const logValOnChange = (value) => {
  console.log('VALUE!', value)
}
const unsubscribe = userStore.subscribe(logValOnChange)

export const {
  useUserState: userStore.useFlowState,
  useUserSelector: userStore.useFlowSelector,
  updateUser: userStore.update,
}
```

Grab the full state, and go buck-wild.

```ts
import { useUserState } from '../userStore';

// in your component
const [userProfile, setUserProfile] = useUserState();

// will preserve the description state from above via shallow merge.
setUserProfile({ user: { name: 'Jimmy B', age: 34 } }); // shallow merge.
setUserProfile({ user: { name: 'Jimmy Bananas', age: 32 } }); // shallow merge.
setUserProfile({ meh: {} }); // full state replacement. Removes description, user, etc. Just have meh now.
```

Grab a slice of state, which will optimize your renders for you naturally via React's useSyncExternalStore, and also go buck-wild. For more details, see the API docs below.

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

**Note** - If you update a key _not returned_ by your selector, you component will not re-render, as the specific slice has remained unchanged.

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

- **useFlowState(): [T, update]** - React hook to get full state and updater function. Works just like useState, but with shallow merging.
- **useFlowSelector(selector): [U, update]** - React hook to get a slice of state. Takes a selector function similar to RTK. Note - if the slice of state doesn't change, the component doesn't re-render. The update function is the same as the useFlowState above.
- **update(partialOrFn, replace = false)** - Updates state. If the state changed, notify is called and all listeners are handed the new state.
  - If partialOrFn is a function, the current state is pass in and the result is shallow merged with the current state.
  - If partialOrFn is an object, it is shallow merged with the current state.
  - If the partialOrFn is not an object, state is directly replaced.
  - if replace is true, then state is directly replaced.
- **getState** - Returns the current state.
- **getInit** - Returns the initial state.
- **subscribe** - Subscribes a function to state changes. Returns an unsubscribe function.
- **unsubscribe** - Unsubscribes a given function from the value.
- **unsubscribeAll** - Unsubscribes all listeners from the value.
- **notify** - Calls all listener callbacks with the value. Note, you can manually pass in a value that will then get handed to all of the listeners, but this is not recommended.
- **resetState** - Resets the stateful value to the original initial state.

# Additional Notes

- The "shallow merge" functionality only works at the top level. If you are deeply nesting state, the nested objects will not be shallow merged with each other. Instead, they will likely be replaced.
- Only object literals are shallow merged.
- The useFlowSelector function returns the full state update function. You must update your slice of state by updating the full state in the flow store.
