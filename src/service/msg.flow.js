const botresponsetype = require('../constants/botresponsetype.constants');
const bottemplateoption = require('../constants/bottemplateoption.constants');
const bottemplatetype = require('../constants/bottemplatetype.constants');

module.exports = [
  {
    id: 0,
    template: bottemplatetype.OPTION,
    templateOption: bottemplateoption.INLINEBUTTONS,
    text: 'Olá! Vimos que você participou do minicurso do ADCC. Gostaríamos de saber como foi sua experiência. Pode nos ajudar? É rapidinho :) \n\nPor favor, responda as perguntas com Sim ou Não.\n\nFicou perdido no conversa, escreva: Ajuda.',
    response: [
      {
        msg: 'Não',
        nextMsgId: 1
      },
      {
        msg: 'Sim',
        nextMsgId: 2
      }
    ],
    first: true
  },
  {
    id: 1,
    template: bottemplatetype.TEXT,
    text: 'Ok, obrigado.',
    end: true
  },
  {
    id: 2,
    template: bottemplatetype.OPTION,
    templateOption: bottemplateoption.INLINEBUTTONS,
    text: 'O local e o material disponibilizado foram adequados para o minicurso? Por favor, responda Sim ou Não.',
    response: [
      {
        msg: 'Não',
        nextMsgId: 3
      },
      {
        msg: 'Sim',
        nextMsgId: 3
      }
    ]
  },
  {
    id: 3,
    template: bottemplatetype.OPTION,
    templateOption: bottemplateoption.INLINEBUTTONS,
    text: 'O palestrante mostrou pleno domínio sobre a ferramenta? Por favor, responda Sim ou Não.',
    response: [
      {
        msg: 'Não',
        nextMsgId: 4
      },
      {
        msg: 'Sim',
        nextMsgId: 4
      }
    ]
  },
  {
    id: 4,
    template: bottemplatetype.OPTION,
    templateOption: bottemplateoption.INLINEBUTTONS,
    text: 'O palestrante se mostrou disponível para esclarecer dúvidas? Por favor, responda Sim ou Não.',
    response: [
      {
        msg: 'Não',
        nextMsgId: 5
      },
      {
        msg: 'Sim',
        nextMsgId: 5
      }
    ]
  },
  {
    id: 5,
    template: bottemplatetype.TEXT,
    text: 'Muito obrigado pela participação :)',
    end: true
  }
]
