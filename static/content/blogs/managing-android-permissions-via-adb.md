---
title:
  text: "Managing Android Permissions via ADB"
  config: "2c 3.5c 2.5 2.5 3c"
description: "Managing Android permissions can be a pain when apps haven't caught up with OS changes. Here's how to fix it from the command line."
published_at: "March 19, 2026"
tags: ["android", "tutorial", "adb"]
author: "abror"
reading_time: 3
draft: false
---

# About

Managing Android permissions may occasionally be a real pain, especially when Google changes certain tidbits and the applications aren't updated to reflect the changes in time.

For instance, the most recent version of Android to date, Tiramisu (13), has three new granular media permissions instead of the old; `READ_EXTERNAL_STORAGE` we now have 3 new ones; `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `READ_MEDIA_AUDIO`.

Recently one of my friends was using an app called Xtra, a niche alternative front end to the official Twitch app that is significantly superior in my opinion. However, as of the time of writing this, the main developer has not added the new granular permissions to his manifest.

The app is still fully functional, but when you attempt to download a VOD, it simply sends a request to `READ_EXTERNAL_STORAGE`, which is no longer supported in Android 13; the request fails, and you are left stuck unable to download the VOD.

Giving Xtra the three new permissions manually is the answer, isn't it? Yes… but no. In more recent Android versions, Google decided that users may no longer assign any permission to any app via the graphical user interface (GUI), presumably for security concerns, So the app will not appear in your permission manager for that specific permission if it does not provide it in the manifest.

Fortunately, if you have an USB cable and a computer running Windows, Linux, or MacOS, we can bypass the GUI and use the adb command line to add the necessary permission.

## How to

**1.** First, you will need to download <a href="https://developer.android.com/tools/releases/platform-tools" target="_blank" rel="noopener noreferrer">SDK Platform Tools</a>.

**2.** Extract the SDK to a directory.

**3.** Open a terminal and `cd` to the directory. If you hit SHIFT + Right click on the directory itself, Windows will prompt you to launch Powershell, allowing you to quickly start a terminal on that directory.

**4.** Before starting to fiddle with the terminal, make sure you connect your Android device to the PC via a USB cord and turn on USB Debugging in your dev tool settings.

If you don't see the developer options in your settings, on Android 4.2 and higher, you must tap the Build Number option 7 times. You can find this option in one of the following locations, depending on your Android version:

- Android 9 and higher: `Settings > About Phone > Build Number`
- Android 8.0.0 / 8.1.0: `Settings > System > About Phone > Build Number`
- Android 7.1 and lower: `Settings > About Phone > Build Number`

**5.** Now we can go back home; the terminal first start by typing:

```
.\adb devices
```

This will display a list of all currently connected Android devices, as illustrated below.

**6.** If your device is unauthorized like mine is, you don't need to worry; all you need to do is either revoke USB debugging authorizations or disable and then re-enable USB debugging such that it prompts you for your computer's RSA key.

**7.** Next, access the shell with:

```
.\adb shell
```

**8.** Last but not least, now that we are in our phone shell, we can do a variety of things. One of them is changing permissions by entering:

```
pm grant <package-name> <permission>
```

You can get the package-name either by using a root explorer, If it's on F-Droid, you can typically find the package name in the URL, or you can download Package Name Viewer 2.0 even though I dislike downloading an entire software for such a simple operation.

In our case f-droid.org/en/packages/"com.github.andreyasadchy.xtra" So the commands would be:

```
pm grant com.github.andreyasadchy.xtra android.permission.READ_MEDIA_IMAGES
pm grant com.github.andreyasadchy.xtra android.permission.READ_MEDIA_VIDEO
pm grant com.github.andreyasadchy.xtra android.permission.READ_MEDIA_AUDIO
```

It's that easy.
