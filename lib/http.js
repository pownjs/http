const split = function*(input, delim) {
    let lastIndex = 0

    while (true) {
        const index = input.indexOf(delim, lastIndex)

        if (index < 0) {
            yield input.slice(lastIndex, input.length)

            break
        }
        else {
            yield input.slice(lastIndex, index)
        }

        lastIndex = index + delim.length
    }
}

const parseMessage = (input, delim = '\r\n') => {
    const it = split(input, delim)

    let offset = 0
    let initialLine = it.next()

    if (initialLine.done === true) {
        throw new Error('cannot parse initial line')
    }
    else {
        initialLine = initialLine.value
    }

    offset += initialLine.length + delim.length

    initialLine = initialLine.toString()

    const headers = []

    while (true) {
        const next = it.next()

        if (next.done === true || next.value.length === 0) {
            break
        }

        headers.push(next.value.toString())

        offset += next.value.length + delim.length
    }

    offset += delim.length

    const body = input.slice(offset, input.length)

    return { initialLine, headers, body }
}

const parseHeadersArray = (headers, sep = ':') => {
    const convertedHeaders = {}

    for (let header of Array.from(headers)) {
        const index = header.indexOf(sep)

        let name
        let value

        if (index > 0) {
            name = header.slice(0, index).toString()
            value = header.slice(index + 1, header.length).toString()
        }
        else {
            name = header.toString()
            value = ''
        }

        name = name.trim()
        value = value.replace(/^\s+/, '')

        if (convertedHeaders[name]) {
            if (!Array.isArray(convertedHeaders[name])) {
                convertedHeaders[name] = [convertedHeaders[name]]
            }

            convertedHeaders[name].push(value)
        }
        else {
            if (name.toLowerCase() === 'set-cookie') {
                value = [value]
            }

            convertedHeaders[name] = value
        }
    }

    return convertedHeaders
}

const buildHeadersArray = (headers, delim = '\r\n', sep = ':') => {
    let convertedHeaders = []

    for (let name in headers) {
        const value = headers[name]

        if (Array.isArray(value)) {
            for (let item of Array.from(value)) {
                convertedHeaders.push(`${name}${sep} ${item || ''}`)
            }
        }
        else {
            convertedHeaders.push(`${name}${sep} ${value || ''}`)
        }
    }

    convertedHeaders = convertedHeaders.join(delim)

    if (convertedHeaders.length > 0) {
        convertedHeaders = convertedHeaders + delim
    }

    return convertedHeaders
}

const parseHeaders = (input, delim = '\r\n', sep = ':') => {
    const it = split(input, delim)

    const headers = []

    while (true) {
        const next = it.next()

        if (next.done === true || next.value.length === 0) {
            break
        }

        headers.push(next.value)
    }

    return parseHeadersArray(headers, sep)
}

const buildHeaders = (headers, delim = '\r\n', sep = ':') => {
    return buildHeadersArray(headers, delim, sep)
}

const parseRequest = (input, delim = '\r\n') => {
    const req = parseMessage(input, delim)

    const [method, uri, version] = Array.from(req.initialLine.split(' ', 3))

    req.method = method
    req.uri = uri
    req.version = version
    req.headers = parseHeadersArray(req.headers)

    delete req.initialLine

    return req
}

const buildRequest = (req, delim = '\r\n') => {
    const method = req.method || 'GET'
    const { uri } = req
    const version = req.version || 'HTTP/1.1'
    const headers = buildHeadersArray(req.headers, delim)
    const body = Buffer.from(req.body || '')

    return `${method} ${uri} ${version}${delim}${headers}${delim}${body.toString()}`
}

const buildRequestRaw = (req, delim = '\r\n') => {
    const method = req.method || 'GET'
    const { uri } = req
    const version = req.version || 'HTTP/1.1'
    const headers = buildHeadersArray(req.headers, delim)
    const body = Buffer.from(req.body || '')

    return Buffer.concat([Buffer.from(`${method} ${uri} ${version}${delim}${headers}${delim}`), body])
}

const parseResponse = (input, delim = '\r\n') => {
    const res = parseMessage(input, delim)

    const [version, code, message] = Array.from(res.initialLine.split(' ', 3))

    res.responseVersion = version
    res.responseCode = parseInt(code, 10)
    res.responseMessage = message
    res.responseHeaders = parseHeadersArray(res.headers)
    res.responseBody = res.body

    delete res.initialLine
    delete res.headers
    delete res.body

    return res
}

const buildResponse = (res, delim = '\r\n') => {
    const version = res.responseVersion || 'HTTP/1.1'
    const code = res.responseCode
    const message = res.responseMessage || ''
    const headers = buildHeadersArray(res.responseHeaders, delim)
    const body = Buffer.from(res.responseBody || '')

    return `${version} ${code} ${message}${delim}${headers}${delim}${body.toString()}`
}

const buildResponseRaw = (res, delim = '\r\n') => {
    const version = res.responseVersion || 'HTTP/1.1'
    const code = res.responseCode
    const message = res.responseMessage || ''
    const headers = buildHeadersArray(res.responseHeaders, delim)
    const body = Buffer.from(res.responseBody || '')

    return Buffer.concat([Buffer.from(`${version} ${code} ${message}${delim}${headers}${delim}`), body])
}

const detectLineDelimiter = (input) => {
    const n = '\n'
    const rn = '\r\n'

    const nIndex = input.indexOf(n);
    const rnIndex = input.indexOf(rn);

    if (rnIndex > nIndex || rnIndex < 0) {
        return n
    }
    else {
        return rn
    }
}

module.exports = {
    split,

    parseMessage,

    parseHeadersArray,
    buildHeadersArray,
    parseHeaders,
    buildHeaders,

    parseRequest,
    buildRequest,
    buildRequestRaw,

    parseResponse,
    buildResponse,
    buildResponseRaw,

    detectLineDelimiter
}
