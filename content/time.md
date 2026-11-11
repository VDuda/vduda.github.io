+++
categories = ["time"]
comments = false
date = "2019-10-02T15:59:13-04:00"
draft = false
showpagemeta = true
showcomments = true
slug = "time"
aliases = ["/time/time/"]
tags = ["time"]
title = "What makes time special?"
description = "Attemping to define time"

+++

Well for one, the first come first serve principle doesn't *always* hold true within the landscape of software. Time is maleable within the computer science world. Misunderstanding time has led to space shuttle explosions, database exploits, incorrect gps direction, and plenty of other examples! 

For the past few years, I have devoted a significant amount of time to troubleshooting issues related with time. Time has a massive impact on our society based on how we: define, calculate, and understand time. Working with time is engrossing, it could be exasperating at times, but it always provides valuable insights. One might assume that software is flawless, but all code has bugs, and modern software is no exception.

I am referring to the intriguing way in which computers handle time, as well as the basic pitfalls that are inherent in how we humans have created our calendar, with daylight saving time being only the most obvious example.

In reality, many of these misunderstandings emerge in other people's (as well as my own) applications that I thought it would be beneficial to compile a list of the most common issues here.


## All of these assumptions are wrong

* *Time has no beginning and no end.*
* There are always 24 hours in a day.
* Months have either 30 or 31 days.
* Years have 365 days.
* February is always 28 days long.
* Any 24-hour period will always begin and end in the same day (or week, or month).
* A week always begins and ends in the same month.
* A week (or a month) always begins and ends in the same year.
* The machine that a program runs on will always be in the GMT time zone. (* the TZ of the application will never change depending where it's run)

* The system clock will always be set to the correct local time.
* The system clock will always be set to a time that is not wildly different from the correct local time.
* If the system clock is incorrect, it will at least always be off by a consistent number of seconds.
* The server clock and the client clock will always be set to the same time.
* The server clock and the client clock will always be set to around the same time.

Ok, but the time on the server clock and time on the client clock would never be different by a matter of decades.

* If the server clock and the client clock are not in sync, they will at least always be out of sync by a consistent number of seconds.
* The server clock and the client clock will use the same time zone.
* The system clock will never be set to a time that is in the distant past or the far future.
* Time has no beginning and no end.
* One minute on the system clock has exactly the same duration as one minute on any other clock

Ok, but the duration of one minute on the system clock will be pretty close to the duration of one minute on most other clocks.
Fine, but the duration of one minute on the system clock would never be more than an hour.
You can’t be serious.

* The smallest unit of time is one second.
* fine, one millisecond.
* fine, one nanosecond.
* It will never be necessary to set the system time to any value other than the correct local time.
* fine, testing might require setting the system time to a value other than the correct local time but it will never be necessary to do so in production.
* Time stamps will always be specified in a commonly-understood format (unix) like 1339972628 or 133997262837.
* Time stamps will always be specified in the same format.
* Time stamps will always have the same level of precision.
* A time stamp of sufficient precision can safely be considered unique.
* A timestamp represents the time that an event actually occurred.
* Human-readable dates can be specified in universally understood formats such as 05/07/11.
