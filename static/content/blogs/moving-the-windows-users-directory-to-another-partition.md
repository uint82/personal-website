---
title:
  text: "Moving the Windows Users Directory to Another Partition"
  config: "2.8c 3 1.4 1.4 2.6c 1.4 3c"
description: "A step-by-step guide to relocating the Windows Users directory to another partition using Audit Mode and Sysprep. This tutorial walks through XML configuration, partition setup, and command-line execution to safely move user data before completing Windows installation."
published_at: "February 28, 2026"
tags: ["windows", "technology"]
author: "abror"
reading_time: 2
draft: false
---

## About

Today, I’ll demonstrate how to move the Windows **Users** directory to a different partition using **Windows Audit Mode** and a carefully configured **XML answer file**.
This method allows you to relocate user data (for example, to `D:`) *before* the Windows installation is finalized, keeping your system drive clean and making future reinstalls easier.

---

## Process

### Welcome

Begin the Windows installation as usual.
After the first reboot, when you reach the **Welcome** screen, press:
**CTRL + Shift + F3**
This will restart Windows into **Audit Mode**, which allows system-level changes before user accounts are created.

Once in Audit mode, close the window that appears, copy the XML Next, transfer the XML file into the partition designated for the new path, and ensure that the partition alias is set correctly before moving forward. You can change it with the Disk Partition Manager while in audit mode.

---

### Partition

Copy your `relocate.xml` file to the partition you want to use as the new Users directory (commonly `D:`).

If the target partition does not already have the desired drive letter, you can change it using **Disk Management** while still in Audit Mode.

> ⚠️ If you choose a drive letter other than `D:`, make sure to update the XML file accordingly.

---

### XML

Open an **Administrator Command Prompt** and run the following commands:

```cmd
net stop wmpnetworksvc
%windir%\system32\sysprep\sysprep.exe /oobe /reboot /unattend:d:\relocate.xml
```
Upon completion, your PC will reboot, and the Windows installation will proceed as usual, integrating the user directory changes seamlessly and without any hitches.

A handy tip: to expedite the installation, since I utilize a USB flash drive, I create a new directory on the drive to house the XML file, accompanied by a txt file containing the necessary terminal commands.
