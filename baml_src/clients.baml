// Learn more about clients at https://docs.boundaryml.com/docs/snippets/clients/overview

client<llm> CustomGPT4o {
  provider openai
  options {
    model "gpt-4o"
    api_key env.OPENAI_API_KEY
    temperature 0.0
  }
}

client<llm> CustomGPT4oMini {
  provider openai
  retry_policy Exponential
  options {
    model "gpt-4o-mini"
    api_key env.OPENAI_API_KEY
    temperature 0.0
  }
}

client<llm> CustomSonnet {
  provider anthropic
  options {
    model "claude-3-7-sonnet-20250219"
    api_key env.ANTHROPIC_API_KEY
    temperature 0.0
  }
}


client<llm> CustomHaiku {
  provider anthropic
  retry_policy Constant
  options {
    model "claude-3-haiku-20240307"
    api_key env.ANTHROPIC_API_KEY
    temperature 0.0
  }
}

client<llm> CustomGemini25Pro {
  provider google-ai
  retry_policy Constant
  options {
    model "gemini-2.5-pro-exp-03-25"
    api_key env.GOOGLE_API_KEY
    generationConfig {
      temperature 0.5
    }
  }
}

client<llm> CustomGemini20FlashLite {
  provider google-ai
  retry_policy Constant
  options {
    model "gemini-2.0-flash-lite"
    api_key env.GOOGLE_API_KEY
    generationConfig {
      temperature 1.0
    }
  }
}


client<llm> CustomGemini25FlashPreview {
  provider google-ai
  retry_policy Constant
  options {
    model "gemini-2.5-flash-preview-04-17"
    api_key env.GOOGLE_API_KEY
    generationConfig {
      temperature 0.5
    }
  }
}

// https://docs.boundaryml.com/docs/snippets/clients/round-robin
client<llm> CustomFast {
  provider round-robin
  options {
    // This will alternate between the two clients
    strategy [CustomGPT4oMini, CustomHaiku]
  }
}

// https://docs.boundaryml.com/docs/snippets/clients/fallback
client<llm> OpenaiFallback {
  provider fallback
  options {
    // This will try the clients in order until one succeeds
    strategy [CustomGPT4oMini, CustomGPT4oMini]
  }
}

// https://docs.boundaryml.com/docs/snippets/clients/retry
retry_policy Constant {
  max_retries 3
  // Strategy is optional
  strategy {
    type constant_delay
    delay_ms 200
  }
}

retry_policy Exponential {
  max_retries 2
  // Strategy is optional
  strategy {
    type exponential_backoff
    delay_ms 300
    mutliplier 1.5
    max_delay_ms 10000
  }
}