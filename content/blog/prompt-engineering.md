+++
categories = ["Technology"]
comments = true
date = "2023-01-08T11:36:00-05:00"
draft = false
showpagemeta = true
showcomments = true
slug = "prompt-engineering"
aliases = ["/blog/prompt-engineering-deep-dive/"]
tags = ["LLMs", "NLP", "Prompt Engineering", "Machine Learning", "Infrastructure"]
title = "Prompt Engineering Will Not Be Necessary in the Future"
description = "We discuss prompt engineering, as an NLP task, is not sustainable and the need for more structured input and output formats for querying large language models."
+++


Prompting large language models (LLMs) is more of an art than a science, and it requires significant effort to develop useful prompts. However, prompt engineering is not a sustainable approach to querying LLMs, and it won't be necessary in the future.

Current prompt engineering methods rely on concatenation or templating, but these have limitations for handling complex prompts and require structured data inputs and outputs for best use.

Prompt engineering today primarily relies on prompt concatenation or templating. For instance, [`latent-browser`](https://github.com/jbilcke/latent-browser) uses this approach to generate web applications in real-time by templating the user's query under `${query}`.

```
Imagine that you are a senior frontend engineer tasked with developing a web application using only HTML and JavaScript. 

Rather than writing the code yourself, you are asked to create a valid spec of the application in JSON format. Here is the format

{example json}

While some examples may be provided, you will need to adapt them to the specific application brief rather than copying them exactly.
```

Here are some other latent browser LLMs
- https://www.autobackend.dev/
- https://www.vivid.lol/ 
- https://www.durable.co/

Prompt engineering is more of a systems engineering problem than a machine learning one. To move beyond prompt engineering, we need to find ways to bring more structure to the input and output of querying LLMs. One possible solution is to create a purpose-built DSL for prompts. This will help condense prompt and wire context, providing more room for instruction and extracting more meaning. Another solution is to create schema around LLM input and output. Whether it is plain JSON or something more complex that can be type-safe, we need to develop a more structured approach to querying LLMs.

Multiple runtimes will also be crucial in querying LLMs. Some runtimes will be language-level, such as Python REPLs to compiled code, while others will be lower-level, such as WASM binaries runnable in the browser. Others will be APIs with a specified behavior. By utilizing multiple runtimes, we can scale LLMs in a more traditional distributed system.

Some possibilities:

- A purpose-built DSL for prompts (see [Prompting is Programming: A Query Language for Large Language Models](https://arxiv.org/abs/2212.06094) (December 2022)). According to the Heptagon of Configuration, DSLs are the next step, followed by scripting and general-purpose languages. Denser prompts provide more room for instruction, and denser output leads to more meaning extraction.

- Schema around LLM I/O, whether it's plain JSON (easiest to parse) or something type-safe, is yet to be determined. TypeScript is often a good choice.

- Multiple runtimes are critical, including where they can run, what they can calculate, and how to call them. Some runtimes are language-level, such as Python REPLs to compiled code, while others are lower-level, like WASM binaries runnable in the browser. Others are APIs with a defined behavior.

- DAGs, parallelization, map-reduce, concurrency, and ensemble models are essential for scaling LLMs. While LLMs will continue to improve in size, speed, and optimization, a more traditional distributed system can currently scale them. LLMs can specify both the tasks to perform and the DAG and ordering of tasks, such as which jobs depend on each other or which can be done in parallel.


To sum up, prompt engineering is an unsustainable way of querying LLMs, and it won't be needed in the future. Rather, we should focus on creating more structure in the input and output of LLM queries. We can achieve this by employing purpose-built DSLs, developing schemas, and using multiple runtimes, which will allow us to move beyond prompt engineering and fully utilize LLMs' potential for solving complex tasks in a sustainable and scalable way.
