const assert = require('assert')

const http = require('../lib/http')

describe('http', () => {
    it('parseMessage01', () => {
        const m = http.parseMessage('')

        assert.equal(m.initialLine, '')
        assert.equal(m.headers.length, 0)
        assert.equal(m.body, '')

    })

    it('parseMessage01.01', () => {
        const m = http.parseMessage(Buffer.from(''))

        assert.equal(m.initialLine, '')
        assert.equal(m.headers.length, 0)
        assert.equal(m.body.length, 0)
    })

    it('parseMessage02', () => {
        const m = http.parseMessage(' ')

        assert.ok(m.initialLine === ' ')
        assert.ok(m.headers.length === 0)
        assert.ok(m.body === '')
    })

    it('parseMessage03', () => {
        const m = http.parseMessage('\r\n')

        assert.ok(m.initialLine === '')
        assert.ok(m.headers.length === 0)
        assert.ok(m.body === '')
    })

    it('parseMessage04', () => {
        const m = http.parseMessage('\r\n\r\n')

        assert.ok(m.initialLine === '')
        assert.ok(m.headers.length === 0)
        assert.ok(m.body === '')
    })

    it('parseMessage05', () => {
        const m = http.parseMessage('\r\n\r\n\r\n')

        assert.ok(m.initialLine === '')
        assert.ok(m.headers.length === 0)
        assert.ok(m.body === '\r\n')
    })

    it('parseMessage06', () => {
        const p = http.parseMessage('GET http://test/ HTTP/1.1\r\nHeader1: value1\r\n\r\nbody')

        assert.equal(p.initialLine, 'GET http://test/ HTTP/1.1')
        assert.equal(p.headers.length, 1)
        assert.equal(p.body, 'body')
    })

    it('parseMessage06.01', () => {
        const p = http.parseMessage(Buffer.from('GET http://test/ HTTP/1.1\r\nHeader1: value1\r\n\r\nbody'))

        assert.equal(p.initialLine, 'GET http://test/ HTTP/1.1')
        assert.equal(p.headers.length, 1)
        assert.equal(p.body, 'body')
    })

    it('parseMessage07', () => {
        const p = http.parseMessage('HTTP/1.1 200 OK\r\nHeader1: value1\r\n\r\nbody')

        assert.ok(p.initialLine === 'HTTP/1.1 200 OK')
        assert.ok(p.headers.length === 1)
        assert.ok(p.body === 'body')
    })

    it('parseMessage08', () => {
        const p = http.parseMessage('HTTP/1.1 200 OK\r\nHeader1: value1\r\n\r\n')

        assert.ok(p.initialLine === 'HTTP/1.1 200 OK')
        assert.ok(p.headers.length === 1)
        assert.ok(p.body === '')
    })

    it('parseMessage09', () => {
        const p = http.parseMessage('HTTP/1.1 200 OK\r\nHeader1: value1\r\n')

        assert.ok(p.initialLine === 'HTTP/1.1 200 OK')
        assert.ok(p.headers.length === 1)
        assert.ok(p.body === '')
    })

    it('parseMessage10', () => {
        const p = http.parseMessage('HTTP/1.1 200 OK\r\n\r\n')

        assert.ok(p.initialLine === 'HTTP/1.1 200 OK')
        assert.ok(p.headers.length === 0)
        assert.ok(p.body === '')
    })

    it('parseHeadersArray01', () => {
        const h = http.parseHeadersArray(['Header1: value1', 'Header2: value2'])

        assert.ok(Object.keys(h).length === 2)
        assert.ok(h.Header1 != null)
        assert.ok(h.Header1 === 'value1')
        assert.ok(h.Header2 != null)
        assert.ok(h.Header2 === 'value2')
    })

    it('parseHeadersArray02', () => {
        const h = http.parseHeadersArray(['Header1: value1:a', 'Header2: value2:b'])

        assert.ok(Object.keys(h).length === 2)
        assert.ok(h.Header1 != null)
        assert.ok(h.Header1 === 'value1:a')
        assert.ok(h.Header2 != null)
        assert.ok(h.Header2 === 'value2:b')
    })

    it('parseHeadersArray03', () => {
        const h = http.parseHeadersArray(['Set-Cookie: cookie1'])

        assert.ok(Object.keys(h).length === 1)
        assert.ok(h['Set-Cookie'] != null)
        assert.ok(h['Set-Cookie'].length === 1)
        assert.ok(h['Set-Cookie'][0] === 'cookie1')
    })

    it('parseHeadersArray04', () => {
        const h = http.parseHeadersArray(['Set-Cookie: cookie1', 'Set-Cookie: cookie2'])

        assert.ok(Object.keys(h).length === 1)
        assert.ok(h['Set-Cookie'] != null)
        assert.ok(h['Set-Cookie'].length === 2)
        assert.ok(h['Set-Cookie'][0] === 'cookie1')
        assert.ok(h['Set-Cookie'][1] === 'cookie2')
    })

    it('parseHeadersArray05', () => {
        const h = http.parseHeadersArray(['Header1: ', 'Header2: ', 'Header3:', 'Header4:', 'Header5', 'Header6 '])

        assert.ok(Object.keys(h).length === 6)
        assert.ok(h.Header1 != null)
        assert.ok(h.Header1 === '')
        assert.ok(h.Header2 != null)
        assert.ok(h.Header2 === '')
        assert.ok(h.Header3 != null)
        assert.ok(h.Header3 === '')
        assert.ok(h.Header4 != null)
        assert.ok(h.Header4 === '')
        assert.ok(h.Header5 != null)
        assert.ok(h.Header5 === '')
        assert.ok(h.Header6 != null)
        assert.ok(h.Header6 === '')
    })

    it('buildHeadersArray01', () => {
        const h = http.buildHeadersArray(http.parseHeadersArray(['Set-Cookie: cookie1', 'Set-Cookie: cookie2']))

        assert.equal(h, 'Set-Cookie: cookie1\r\nSet-Cookie: cookie2\r\n')
    })

    it('buildHeadersArray02', () => {
        const h = http.buildHeadersArray(http.parseHeadersArray(['set-cookie: cookie1', 'set-cookie: cookie2']))

        assert.equal(h, 'set-cookie: cookie1\r\nset-cookie: cookie2\r\n')
    })

    it('buildHeadersArray03', () => {
        const h = http.buildHeadersArray({ 'server': '123', 'set-cookie': ['cookie1', 'cookie2'] })

        assert.equal(h, 'server: 123\r\nset-cookie: cookie1\r\nset-cookie: cookie2\r\n')
    })

    it('parseRequest01', () => {
        const p = http.parseRequest('GET http://test/ HTTP/1.1\r\nHeader1: value1\r\n\r\nbody')

        assert.equal(p.method, 'GET')
        assert.equal(p.uri, 'http://test/')
        assert.equal(p.headers.Header1, 'value1')
        assert.equal(p.body, 'body')
    })

    it('parseRequest01.01', () => {
        const p = http.parseRequest(Buffer.from('GET http://test/ HTTP/1.1\r\nHeader1: value1\r\n\r\nbody'))

        assert.equal(p.method, 'GET')
        assert.equal(p.uri, 'http://test/')
        assert.equal(p.headers.Header1, 'value1')
        assert.equal(p.body.toString(), 'body')
    })

    it('parseRequest02', () => {
        const p = http.parseRequest('GET http://test/ HTTP/1.1\r\nHeader1: value1')

        assert.ok(p.method === 'GET')
        assert.ok(p.uri === 'http://test/')
        assert.ok(p.headers.Header1 === 'value1')
        assert.ok(p.body === '')
    })

    it('parseRequest03', () => {
        const p = http.parseRequest('POST http://test/ HTTP/1.1\r\n\r\nbody')

        assert.ok(p.method === 'POST')
        assert.ok(p.uri === 'http://test/')
        assert.ok(Object.keys(p.headers).length === 0)
        assert.ok(p.body === 'body')
    })

    it('parseResponse01', () => {
        const p = http.parseResponse('HTTP/1.1 200 OK\r\nHeader1: value1\r\n\r\nbody')

        assert.equal(p.responseCode, 200)
        assert.equal(p.responseMessage, 'OK')
        assert.equal(p.responseHeaders.Header1, 'value1')
        assert.equal(p.responseBody, 'body')
    })

    it('buildRequest01', () => {
        const i = 'GET http://test/ HTTP/1.1\r\nHeader1: value1\r\n\r\nbody';
        const p = http.parseRequest(i)
        const b = http.buildRequest(p)

        assert.equal(b, i)
    })

    it('buildRequest02', () => {
        const b = http.buildRequest({ uri: 'http://test/' })

        assert.equal(b, 'GET http://test/ HTTP/1.1\r\n\r\n')
    })

    it('buildResponse01', () => {
        const i = 'HTTP/1.1 200 OK\r\nHeader1: value1\r\n\r\nbody'
        const p = http.parseResponse(i)
        const b = http.buildResponse(p)

        assert.equal(b, i)
    })

    it('buildResponse', () => {
        const b = http.buildResponse({ responseCode: 200 })

        assert.equal(b, 'HTTP/1.1 200 \r\n\r\n')
    })

    it('detectLineDelimiter', () => {
        assert.equal(http.detectLineDelimiter(''), '\n')
        assert.equal(http.detectLineDelimiter('\n'), '\n')
        assert.equal(http.detectLineDelimiter('\r\n'), '\r\n')
    })
})
