class MessageHandler {
  constructor() {
    this.botresponsetype = require('../constants/botresponsetype.constants');
    this.bottemplatetype = require('../constants/bottemplatetype.constants');
    this.messenger = require('../service/messenger');
    this.msgflow = require('../service/msg.flow');
    this.msgDefault = {
      completedInterraction: 'Obrigado pela participação, seu feedback já foi recebido com sucesso!',
      noValidAwnser: 'Desculpa, não compreendo está resposta.'
    }
    this.token = 'EAAGZAQDP3SsgBAMPjMLmTZBpxKAmB2GXZBuR4xrO35wV9ZCBOZA436KwN2dDEsu3ZAeSYe5efXsZBSHOCaqy4kPyZAytEhaBrLuSqmcoKB6xeNBFEYtEk2bAfAvUXi1nAtG2mOpclYx3HProcS6ecPV2MhrZAgCYSTPSo4MJA6b7EuQZDZD';
    this.sessions = [];
  }

  _sessionHandler(response) {
    console.log(`___ _sessionHandler -> userId: ${response.userId}`);
    let session = null, position = null;
    for (let index = 0; index < this.sessions.length; index++) {
      const ssn = this.sessions[index];
      console.log(`___ _sessionHandler -> userId: ${response.userId} - index: ${index} - session:`, ssn);
      if(ssn.userId === response.userId){
        session = Object.assign({}, ssn);
        position = index;
        console.log(`___ _sessionHandler -> session located:`, session);
        break;
      }
    }

    if (!session) {
      session = {
        userId: response.userId,
        id: this.sessions.length,
        end: false,
        lastMsg: null,
        payload: response
      };
      console.log(`___ _sessionHandler -> creating new session:`, session);
      this.sessions.push(session);
    } else if (!session.end) {
      session.payload = response;
      this.sessions[position] =  Object.assign({}, session);
      console.log(`___ _sessionHandler -> session already finished.`, session);
    }

    return session;
  }

  _setNextMessage(session) {
    const payload = session.payload;
    const lastMsg = session.lastMsg;
    const responseType = payload.response.responseType;
    const value = (payload.response && payload.response.value) ? payload.response.value : null;
    console.log('______ setNextMessage - payload:', payload)
    console.log('______ setNextMessage - value:', value)
    console.log('______ setNextMessage - responseType:', responseType)
    switch (responseType) {

      case this.botresponsetype.TEXT:

        console.log('_____ _setNextMessage TEXT - lastMSG:', lastMsg)
        if (lastMsg && lastMsg.response && payload.response.value) {
          const anwser = lastMsg.response.find(resp => resp.msg === value);
          if (anwser && anwser.nextMsgId) {
            return this.msgflow.find(msg => msg.id === anwser.nextMsgId);
          }
        }
        return null;

      case this.botresponsetype.BUTTONS:

        console.log('_____ _setNextMessage BUTTONS - lastMSG:', lastMsg)
        const newMsg = this.msgflow.find(msg => msg.id == value);
        return newMsg;
      case this.botresponsetype.START:
        return this.msgflow[0];

      default:
        return null;
    }
  }

  _buildMessage(session, msg) {
    let msgPkg = {
      userId: session.userId,
      arg: {
        TemplateType: null,
        TemplateOption: null,
        Options: null,
        Text: null
      }
    }

    if (session.end) {
      msgPkg.arg.TemplateType = this.bottemplatetype.TEXT;
      msgPkg.arg.Text = this.msgDefault.completedInterraction;
    } else if (session.lastMsg) {
      if (msg) {
        session.lastMsg = msg;
        if (msg.end) session.end = true
        this.sessions[session.id] = session;
        msgPkg.arg.TemplateType = msg.template;
        msgPkg.arg.Text = msg.text;
        msgPkg.arg.TemplateOption = msg.templateOption;
        msgPkg.arg.Options = msg.response;
      } else {
        msgPkg.arg.TemplateType = this.bottemplatetype.TEXT;
        msgPkg.arg.Text = this.msgDefault.noValidAwnser;
      }
    } else {
      if (msg) {
        session.lastMsg = msg;
        this.sessions[session.id] = session;
      } else {
        console.log('OCORREU UM ERROR, NAO ACHAMOS PRIMEIRA MESSAGE');
      }
      msgPkg.arg.TemplateType = msg.template;
      msgPkg.arg.TemplateOption = msg.templateOption;
      msgPkg.arg.Options = msg.response;
      msgPkg.arg.Text = msg.text;
    }

    return msgPkg;
  }

  async eventHandler(event) {
    console.log('############################################################');
    console.log('____________________________________________________________');
    console.log('*** SESSIONS:', this.sessions);
    console.log('____________________________________________________________');
    try {
      console.log('___ EVENT:', event);
      console.log('__________________________________________________________');
      let response = this.messenger.getEventData(event);
      console.log('___ RESPONSE:', response);
      console.log('__________________________________________________________');
      let session = this._sessionHandler(response);
      console.log('___ SESSION:', session);
      console.log('__________________________________________________________');
      let msgFlow = this._setNextMessage(session);
      console.log('___ MSGFLOW:', msgFlow);
      console.log('__________________________________________________________');
      const msgPkg = this._buildMessage(session, msgFlow);
      console.log('___ MSGPKG:', msgPkg);
      console.log('__________________________________________________________');
      await this.messenger.sendMessage(this.token, msgPkg.userId, msgPkg.arg);
    } catch (error) {
      console.log('___ ERROR:', error);
    }
    console.log('____________________________________________________________');
    console.log('############################################################');
  }
}

module.exports = new MessageHandler();
