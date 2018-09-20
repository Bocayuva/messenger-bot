class MessageHandler {
  constructor() {
    this.botresponsetype = require('../constants/botresponsetype.constants');
    this.bottemplatetype = require('../constants/bottemplatetype.constants');
    this.messenger = require('../service/messenger');
    this.msgflow = require('../service/msg.flow');
    this.msgDefault = {
      menuMsg: '* Deseja continuar de onde parou, escreva: ultima\n* Deseja encerrar pesquisa, escreva: fim\n* Deseja reiniciar pesquisa, escreva: reiniciar',
      restartSessionMsg: 'Reiniciamos sua pesquisa, obrigado.',
      completedInterraction: 'Obrigado pela participação, seu feedback já foi recebido com sucesso!',
      noValidAwnser: 'Desculpa, não compreendo está resposta.\nQualquer resposta diferente o bot não considerá valida.\nResponda as perguntas somente com as opcões informadas: Sim ou Não.',
      alertAwnser: 'A ultima pergunta realizada, foi:'
    }
    this.token = 'EAAcd0y3CKBUBAMu8Va5hILS6rZCpiwz826w4fXGYhekT5oLTydb5YXdKTHLaG7HoLQIfiZBRnUOF1osR3J2MrHqZB1NCw7gKFQUXVkB4bsSVGRdXKdD9SuUmxP9TzW3UTbboMuqzHpRwe3ozBX6dVGXZAUxg3XmSe95iHeqTdgZDZD';
    this.sessions = [];
  }

  _sessionHandler(response) {
    console.log(`___ _sessionHandler -> userId: ${response.userId}`);
    let session = null, position = null;
    for (let index = 0; index < this.sessions.length; index++) {
      const ssn = this.sessions[index];
      console.log(`___ _sessionHandler -> userId: ${response.userId} - index: ${index} - session:`, ssn);
      if (ssn.userId === response.userId) {
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
      this.sessions[position] = Object.assign({}, session);
      console.log(`___ _sessionHandler -> session already finished.`, session);
    }

    return session;
  }

  async _extraActionForText(session, value){
    console.log('_____ _extraActionForText - session:', session);
    console.log('_____ _extraActionForText - value:', value);

    let extraArgForExtraMessage = {
      TemplateType: this.bottemplatetype.TEXT,
      TemplateOption: null,
      Options: null,
      Text: null
    };

    if (value === 'Última' || value === 'última' || value === 'ultima' || value === 'Ultima' || value === 'ULTIMA') {
      console.log('_____ _extraActionForText - Vamos reenviar a ultima message.');
      extraArgForExtraMessage.Text = this.msgDefault.alertAwnser;
      await this.messenger.sendMessage(this.token, session.userId, extraArgForExtraMessage);
      console.log('_____ _extraActionForText - return this.msgflow[lastMsg.id]:', this.msgflow[lastMsg.id]);
      return this.msgflow[lastMsg.id];
    }

    if (value === 'fim' || value === 'Fim' || value === 'FIM') {
      console.log('_____ _extraActionForText - Vamos encerrar a pesquisa.');
      session.end = true;
      this.sessions[session.id] = session;
      console.log('_____ _extraActionForText - return this.msgflow[1]:', this.msgflow[1]);
      return this.msgflow[1];
    }

    if (value === 'reiniciar' || value === 'Reiniciar' || value === 'REINICIAR') {
      console.log('_____ _extraActionForText - Reiniciar a pesquisa.');
      session.lastMsg = null;
      session.payload = null;
      this.sessions[session.id] = session;
      extraArgForExtraMessage.Text = this.msgDefault.restartSessionMsg;
      await this.messenger.sendMessage(this.token, session.userId, extraArgForExtraMessage);
      console.log('_____ _extraActionForText - return this.msgflow[0]:', this.msgflow[0]);
      return this.msgflow[0];
    }

    if (value === 'menu' || value === 'Menu' || value === 'MENU' ||
      value === 'Socorro' || value === 'socorro' || value === 'SOCORRO' ||
      value === 'Ajuda' || value === 'ajuda' || value === 'AJUDA') {
      console.log('_____ _extraActionForText - Vamos enviar menu de opcoes.');
      extraArgForExtraMessage.Text = this.msgDefault.menuMsg;
      await this.messenger.sendMessage(this.token, session.userId, extraArgForExtraMessage);
    }

    console.log('_____ _extraActionForText - return NULL');
    return null;
  }

  async _setNextMessage(session) {
    const payload = session.payload;
    const lastMsg = session.lastMsg;
    const responseType = payload.response.responseType;
    const value = (payload.response && payload.response.value) ? payload.response.value : null;
    console.log('______ setNextMessage - payload:', payload);
    console.log('______ setNextMessage - value:', value);
    console.log('______ setNextMessage - responseType:', responseType);

    switch (responseType) {

      case this.botresponsetype.TEXT:
        console.log('_____ _setNextMessage TEXT - lastMSG:', lastMsg);
        if (lastMsg && lastMsg.response && payload.response.value) {
          const anwser = lastMsg.response.find(resp => resp.msg === value);
          console.log('_____ _setNextMessage TEXT - anwser:', anwser);
          if (anwser && anwser.nextMsgId) {
            return this.msgflow.find(msg => msg.id === anwser.nextMsgId);
          }
        }
        return this._extraActionForText(session, value);


      case this.botresponsetype.BUTTONS:
        console.log('_____ _setNextMessage BUTTONS - lastMSG:', lastMsg);
        const newMsg = this.msgflow.find(msg => msg.id == value);
        return newMsg;

      case this.botresponsetype.START:
        console.log('_____ _setNextMessage BUTTONS INICIO');
        return this.msgflow[0];

      default:
        return null;
    }
  }

  async _buildMessage(session, msg) {
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
      console.log('_____ _buildMessage - session.end: TRUE');
      msgPkg.arg.TemplateType = this.bottemplatetype.TEXT;
      msgPkg.arg.Text = this.msgDefault.completedInterraction;
    } else if (session.lastMsg) {
      console.log('_____ _buildMessage - session.lastMsg: TRUE');
      if (msg) {
        console.log('_____ _buildMessage - session.lastMsg: TRUE - msg: TRUE');
        session.lastMsg = msg;
        if (msg.end) session.end = true
        this.sessions[session.id] = session;
        msgPkg.arg.TemplateType = msg.template;
        msgPkg.arg.Text = msg.text;
        msgPkg.arg.TemplateOption = msg.templateOption;
        msgPkg.arg.Options = msg.response;
      } else {
        console.log('_____ _buildMessage - session.lastMsg: TRUE - msg: FALSE');
        await this.messenger.sendMessage(this.token, session.userId, {TemplateType: this.bottemplatetype.TEXT, Text: this.msgDefault.noValidAwnser});
        const lstmsg = session.lastMsg
        console.log('_____ _buildMessage - session.lastMsg: TRUE - msg: FALSE - lstmsg:', lstmsg);
        const arg = {
          TemplateType: lstmsg.template,
          Text: lstmsg.text,
          TemplateOption: lstmsg.templateOption,
          Options: lstmsg.response
        }
        await this.messenger.sendMessage(this.token, session.userId, arg);
        return null;
      }
    } else if (msg) {
      console.log('_____ _buildMessage - session.lastMsg: FALSE - msg: TRUE - msg:', msg);
      session.lastMsg = msg;
      this.sessions[session.id] = session;
      msgPkg.arg.TemplateType = msg.template;
      msgPkg.arg.Text = msg.text;
      msgPkg.arg.TemplateOption = msg.templateOption;
      msgPkg.arg.Options = msg.response;
    } else {
      console.log('_____ _buildMessage - NADA PARA FAZER');
      return null;
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
      let msgFlow = await this._setNextMessage(session);
      console.log('___ MSGFLOW:', msgFlow);
      console.log('__________________________________________________________');
      const msgPkg = await this._buildMessage(session, msgFlow);
      console.log('___ MSGPKG:', msgPkg);
      console.log('__________________________________________________________');
      if (msgPkg) await this.messenger.sendMessage(this.token, msgPkg.userId, msgPkg.arg);
    } catch (error) {
      console.log('___ ERROR:', error);
    }
    console.log('____________________________________________________________');
    console.log('############################################################');
  }
}

module.exports = new MessageHandler();
