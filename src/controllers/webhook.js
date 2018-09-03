msghandler = require('../service/msg.handler');

class Webhook {
  facebookVerification(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === 'adcc2018prdMESSENGERAPP') {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  };

  async facebook(req, res) {
    const { body } = req;
    if (body.object === 'page') {
      for (const entry of body.entry) {
        const event = entry.messaging[0];
        await msghandler.eventHandler(event);
      }
    }
    res.send(200, { msg: 'MESSENGER_EVENT_RECEIVED' });
  };
}

module.exports = new Webhook();
