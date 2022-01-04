# add-props-flipflop
Toggle additionalProperties in an OpenAPI spec

## Usage

Use --help to get a list of options
``` text
Usage: add-props-flipflop [options]

Options:
  -V, --version                      output the version number
  -s, --source <source>              Source OpenAPI spec filename
  -o, --output <output>              Output OpenAPI spec filename
  -d, --dereferenced <dereferenced>  Write dereferenced source OpenAPI spec to this filename
  -f, --flipto <flipto>              set additionalProperties to this value (choices: "true", "false")
  -h, --help                         display help for command
```

Convert an OpenAPI spec with additionalProperties set to false
``` bash
add-props-flipflop --source openapi.yaml --output openapi-false.yaml --flipto false
```

Convert an OpenAPI spec with additionalProperties set to true
``` bash
add-props-flipflop --source openapi.yaml --output openapi-false.yaml --flipto true
```

Convert an OpenAPI spec with additionalProperties set to false and a copy of the dereferenced file before setting
``` bash
add-props-flipflop --source openapi.yaml --dereferenced openapi-deref.yaml --output openapi-false.yaml --flipto false
```
