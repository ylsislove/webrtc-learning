// const http = require('http')
const https = require('https')
const finalhandler = require('finalhandler')
const debug = require('debug')('dss:boot')
const router = require('../index')
const fs = require('fs')

var options = {
    key : fs.readFileSync('./cert/ylsislove.com/ylsislove.com.key'),
    cert: fs.readFileSync('./cert/ylsislove.com/ylsislove.com.pem')
}

const https_server = https.createServer(options, function (req, res) {
    router(req, res, finalhandler(req, res))
})

const bind = https_server.listen(443, '0.0.0.0', () => {
  debug(`online @ ${bind.address().port}`)
})

// const server = http.createServer(function (req, res) {
//   router(req, res, finalhandler(req, res))
// })

// const bind = server.listen(process.env.PORT || 3000, () => {
//   debug(`online @ ${bind.address().port}`)
// })
