# Performance

Rendering 10000 (ten thousand) satellites is no easy task. In this file we describe how we optimized the rendering of the satellites.


## No optimization

When we first started rendering the satellites, we did not optimize the rendering or the computation.

This resulted in seconds per frame, instead of frames per second. This was not acceptable, so we started optimizing.

## Batching draw calls

Every thing you see on screen is rendered with a draw call. This is a call to the GPU to render a certain object. This is a very expensive operation, so we want to minimize the amount of draw calls. Without optmiization, we had a draw call for every satellite. 

A fix for this is using InstancedMeshes, where we draw 1 mesh (in our case a Octahedron) for every satellite. This reduces the amount of draw calls for satellites to 1, which is a huge improvement.

A disadvantage of this is, is that we have a maximum amount of satellites we can render. This is set in a constant, and is currently set to 12000. This is a reasonable amount of satellites, and we do not expect to have more satellites in the future.

## Computation on other cores

The propagate function (The function which takes a TLE, and converts is to a position at a certain time) is a very expensive operation. This is done for every satellite, and is done in the main thread. This blocks the main thread, and makes the application unresponsive.

Our solution was to implement a worker structure. This is a structure where we can run functions in a different thread. This is done in `src/worker/worker.ts`. 

Every frame, we ask the worker manager `src/worker/manager.ts` to see if computation is finished. If it is, we get a bigger Float32Array, with every position and velocity of every satellite. This is then used to update the positions of the satellites. Then we ask the worker manager to start computing the new positions of the satellites.

If the computations are not finished, we do not update the positions of the satellites, and just render the old positions. This improves responsiveness of the application, but might lead to flickering if the laptop used is not powerful enough.

When new satellites are added, we reset the workers, and send all the data again. This is quite expensive, but is only done when new satellites are added.

### Disadvantages

Simulation.vue must also use this structure, but this is quite inefficient, as we are only rendering about 10 satellites in the simulation. Every time a parameter is updated, we need to send the new parameters to the workers, which is quite expensive. This is a tradeoff we made, as we the performance in the entire application improved. Adding edge cases for this would make the code quite complex, and we decided against it.

## Conclusion

We have optimized the rendering of the satellites, and the application is now running at 60 FPS on most devices. This is a huge improvement, and we are happy with the result.
