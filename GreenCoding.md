# Green coding

## Introduction

To reduce the environmental impact of software development, we adopt green coding practices. This means that we aim to reduce the energy consumption of our software. This is done by a lot of caching. Because our backend operations are resource intensive, we only run them in the middle of the day, when the overhead from renwable sources is lower. This is done with the help of cronjobs.

All of the data returned, only changes about once per day, so the data can stay in the users laptop for a day. This is done with the help of LocalStorage, and aggresive caching policies at our DNS provider: Cloudflare.


## Power saving

When a device on battery power goes into battery saving mode, we automatically reduce the FPS (Frames per Second) of the application to 30 FPS. This reduces the energy consumption of the device, and is thus green.

When a device is idle for 1 minute, we switch to the homescreen. In this screen, no satellites are rendered, which saves a lot of computational power, and thus energy.
