'use strict';

class Messenger {
  constructor(){
    this.requestPromise = require('request-promise');
    this.BotResponseType = require('../constants/botresponsetype.constants');
    this.BotTemplateType = require('../constants/bottemplatetype.constants');
    this.BotTemplateOption = require('../constants/bottemplateoption.constants');
  }

  getAuthorizationLinkTemplate(botLink, id, phone) {
    if (!botLink) throw new Error('Not receive botLink');
    if (!id) throw new Error('Not receive id');
    if (!phone) throw new Error('Not receive phone');
    return `${botLink}?ref=${id}_${phone.slice(1)}`;
  }

  getEventData(event, getProfile = false) {
    if (!event) throw new Error('event was not passed');

    const getUserProfile = (event, botToken) => {
      if (!botToken) throw new Error('botToken was not passed');
      if (!event) throw new Error('event was not passed');
      return this.requestPromise({
        uri: `https://graph.facebook.com/v2.6/${event}?access_token=${botToken}`,
        method: 'GET',
        json: true
      });
    };

    const getResponse = event => {
      const response = { responseType: null, value: null };
      if (event.read) {
        response.responseType = this.BotResponseType.READ_WATERMARK;
        response.value = { watermark: event.read.watermark, timestamp: event.timestamp };
      } else if (event.delivery) {
        response.responseType = this.BotResponseType.DELIVERY_WATERMARK;
        response.value = { watermark: event.delivery.watermark, timestamp: event.timestamp };
      } else if (event.message) {
        const { message } = event;
        if (message.quick_reply && message.quick_reply.payload) {
          response.responseType = this.BotResponseType.BUTTONS;
          response.value = message.quick_reply.payload;
        } else if (message.text) {
          response.responseType = this.BotResponseType.TEXT;
          response.value = message.text;
        } else if (message.sticker_id) {
          response.responseType = this.BotResponseType.STICKER;
          response.value = message.sticker_id;
        } else if (message.attachments) {
          response.responseType = this.BotResponseType.ATTACHMENTS;
          response.value = message.attachments;
        }
      } else if (event.postback && event.postback.payload) {
        if (event.postback.payload === 'GET_STARTED_PAYLOAD') {
          response.responseType = this.BotResponseType.START;
          response.value = getUrlParameter(event);
        } else {
          response.responseType = this.BotResponseType.BUTTONS;
          response.value = event.postback.payload;
        }
      }
      return response;
    };

    const getUrlParameter = event => {
      let referral = null;
      if (event.referral) {
        referral = event.referral;
      } else if (event.postback && event.postback.payload && event.postback.payload.referral) {
        referral = event.postback.payload.referral;
      } else if (event.postback && event.postback.referral) {
        referral = event.postback.referral;
      }
      if (referral && referral.ref) referral = referral.ref;
      return referral;
    };

    const getSenderId = event => {
      let senderId = null;
      if (event && event.sender && event.sender.id) senderId = event.sender.id;
      return senderId;
    };

    const getPageId = event => {
      let pageId = null;
      if (event && event.recipient && event.recipient.id) pageId = event.recipient.id;
      return pageId;
    };

    return {
      userId: getSenderId(event),
      botId: getPageId(event),
      userProfile: getProfile ? getUserProfile(event) : null,
      urlParameter: getUrlParameter(event),
      response: getResponse(event)
    };
  }

  sendMessage(botToken, recipientId, arg) {
    if (!botToken) throw new Error('botToken was not passed');
    if (!recipientId) throw new Error('recipientId was not passed');
    if (!arg) throw new Error('arg was not passed');
    if (!arg.TemplateType) throw new Error('templateType was not passed');

    const callSendAPI = (access_token, body) => {
      if (!body) throw new Error('body was not passed');
      return this.requestPromise({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token },
        method: 'POST',
        body,
        json: true
      });
    };

    // const sendAttachment = (access_token, type, url, is_reusable = true) => {
    //   if (type !== 'image' && type !== 'video' && type !== 'audio' && type !== 'file') throw new Error('media_type is invalid');
    //   const body = {
    //     messaging_type: 'NON_PROMOTIONAL_SUBSCRIPTION',
    //     message: {
    //       attachment: {
    //         type,
    //         payload: {
    //           is_reusable,
    //           url
    //         }
    //       }
    //     }
    //   };

    //   return this.requestPromise({
    //     uri: 'https://graph.facebook.com/v2.6/me/message_attachments',
    //     qs: { access_token },
    //     method: 'POST',
    //     body,
    //     json: true
    //   });
    // };

    const checkIsURL = str => {
      const urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
      const url = new RegExp(urlRegex, 'i');
      return str.length < 2083 && url.test(str);
    };

    const getKeyboardForOptions = (keyboardOptions, templateOption) => {
      if (!keyboardOptions || keyboardOptions.length === 0) throw new Error('No buttons valid');
      if (!templateOption) templateOption = this.BotTemplateOption.BUTTONS;
      if (keyboardOptions.length > 3) templateOption = this.BotTemplateOption.INLINEBUTTONS;
      if (keyboardOptions.length > 13 && templateOption === this.BotTemplateOption.INLINEBUTTONS) throw new Error('Number of buttons pass the limit supported by messenger');
      const options = [];

      if (templateOption === this.BotTemplateOption.BUTTONS) {
        for (const option of keyboardOptions) {
          const isUrl = checkIsURL(option);
          if (isUrl) {
            options.push({ type: 'web_url', url: option, title: option });
          } else {
            options.push({ type: 'postback', title: option.msg, payload: option.nextMsgId });
          }
        }
      } else if (templateOption === this.BotTemplateOption.INLINEBUTTONS) {
        for (const option of keyboardOptions) {
          options.push({ content_type: 'text', title: option.msg, payload: option.nextMsgId });
        }
      } else throw new Error('templateOption is invalid');

      return options;
    };

    // const getKeyboardForMedia = options => {
    //   const keyboard = [];

    //   for (const opt of options) {
    //     const isUrl = checkIsURL(opt);
    //     if (isUrl) {
    //       keyboard.push({ type: 'web_url', url: opt, title: opt });
    //     } else {
    //       keyboard.push({ type: 'postback', title: opt, payload: opt });
    //     }
    //   }

    //   return keyboard;
    // };

    // const setElements = (elements, title, subtitle, url, image_url, messenger_extensions, webview_height_ratio, buttons) => { // messenger_extensions: true or false
    //   if (!webview_height_ratio === 'COMPACT' && !webview_height_ratio === 'TALL' && !webview_height_ratio === 'FULL') throw new Error('webview_height_ratio is invalid');
    //   const element = {
    //     title,
    //     image_url,
    //     subtitle,
    //     default_action: {
    //       type: 'web_url',
    //       url,
    //       messenger_extensions,
    //       webview_height_ratio
    //     },
    //     buttons
    //   };
    //   elements.push(element);
    // };

    // const sendMessageGeneric = (token, recipientId, elements) => {
    //   const messageData = {
    //     messaging_type: 'NON_PROMOTIONAL_SUBSCRIPTION',
    //     recipient: {
    //       id: recipientId
    //     },
    //     message: {
    //       attachment: {
    //         type: 'template',
    //         payload: {
    //           template_type: 'generic',
    //           elements
    //         }
    //       }
    //     }
    //   };
    //   return callSendAPI(token, messageData);
    // };

    const sendMessageAttachment = (token, recipientId, type, url, is_reusable = true) => {
      if (type !== 'image' && type !== 'video' && type !== 'audio' && type !== 'file') throw new Error('media_type is invalid');

      const messageData = {
        messaging_type: 'NON_PROMOTIONAL_SUBSCRIPTION',
        recipient: {
          id: recipientId
        },
        message: {
          attachment: {
            type,
            payload: {
              url,
              is_reusable
            }
          }
        }
      };

      return callSendAPI(token, messageData);
    };

    // const sendMessageMedia = async (token, recipientId, media_type, url, buttons) => {
    //   if (media_type !== 'image' && media_type !== 'video') throw new Error('media_type is invalid');

    //   const attachment = await sendAttachment(token, media_type, url);
    //   const attachment_id = attachment.attachment_id;

    //   const messageData = {
    //     recipient: {
    //       id: recipientId
    //     },
    //     message: {
    //       attachment: {
    //         type: 'template',
    //         payload: {
    //           template_type: 'media',
    //           elements: [
    //             {
    //               media_type,
    //               attachment_id,
    //               buttons
    //             }
    //           ]
    //         }
    //       }
    //     }
    //   };
    //   return callSendAPI(token, messageData);
    // };

    const sendMessageQuickReply = (token, recipientId, text, replies) => {
      const messageData = {
        messaging_type: 'NON_PROMOTIONAL_SUBSCRIPTION',
        recipient: {
          id: recipientId
        },
        message: {
          text: text,
          metadata: '',
          quick_replies: replies
        }
      };

      return callSendAPI(token, messageData);
    };

    const sendMessageButton = (token, recipientId, text, buttons) => {
      const messageData = {
        messaging_type: 'NON_PROMOTIONAL_SUBSCRIPTION',
        recipient: {
          id: recipientId
        },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'button',
              text: text,
              buttons: buttons
            }
          }
        }
      };

      return callSendAPI(token, messageData);
    };

    const sendMessageText = (token, recipientId, text) => {
      const messageData = {
        messaging_type: 'NON_PROMOTIONAL_SUBSCRIPTION',
        recipient: { id: recipientId },
        message: { text }
      };

      return callSendAPI(token, messageData);
    };

    const sendDoubleMsg = async (token, recipientId, media_type, text, url, options, templateOption = null) => {
      await sendMessageAttachment(token, recipientId, media_type, url);

      if (text) {
        if (text.length > 2000) throw new Error('text is invalid');
        if (!options || !options.length) {
          return sendMessageText(token, recipientId, text);
        }

        return sendMessageButton(token, recipientId, text, getKeyboardForOptions(options, templateOption));
      }
    };

    switch (arg.TemplateType) {
      case this.BotTemplateType.TEXT:
        if (!arg.Text || arg.Text.length > 2000) throw new Error('text is invalid');
        return sendMessageText(botToken, recipientId, arg.Text);

      case this.BotTemplateType.OPTION:
        if (!arg.Text || arg.Text.length > 2000) throw new Error('text is invalid');
        if (!arg.Options) throw new Error('keyboard options were not passed');

        switch (arg.TemplateOption) {
          case this.BotTemplateOption.BUTTONS:
            return sendMessageButton(botToken, recipientId, arg.Text, getKeyboardForOptions(arg.Options, arg.TemplateOption));
          case this.BotTemplateOption.INLINEBUTTONS:
            return sendMessageQuickReply(botToken, recipientId, arg.Text, getKeyboardForOptions(arg.Options, arg.TemplateOption));
          default:
            throw new Error('templateOption is invalid');
        }

      case this.BotTemplateType.PHOTO:
        if (!arg.UrlFile) throw new Error('file was not passed');

        // if (arg.Title) {
        //   if (arg.Url) {
        //     const elements = [];
        //     setElements(elements, arg.Title, arg.SubTitle, arg.Url, arg.UrlFile, arg.MessengerExtensions, arg.WebviewHeightRatio, getKeyboardForMedia(arg.Options));

        //     return sendMessageGeneric(botToken, recipientId, elements);
        //   }

        //   return sendDoubleMsg(botToken, recipientId, 'image', arg.Text, arg.UrlFile, arg.Options, arg.TemplateOption);
        // } else if (arg.Options && arg.Options.length > 0) {
        //   return sendMessageMedia(botToken, recipientId, 'image', arg.UrlFile, getKeyboardForMedia(arg.Options));
        // }

        // return sendMessageAttachment(botToken, recipientId, 'image', arg.UrlFile);
        return sendDoubleMsg(botToken, recipientId, 'image', arg.Text, arg.UrlFile, arg.Options, arg.TemplateOption);

      case this.BotTemplateType.VIDEO: //  video should be in MP4 format and no larger than 20MB
        if (!arg.UrlFile) throw new Error('file was not passed');

        // if (!arg.Title && arg.Options.length > 0) {
        //   return sendMessageMedia(botToken, recipientId, 'video', arg.UrlFile, getKeyboardForMedia(arg.Options));
        // }

        return sendDoubleMsg(botToken, recipientId, 'video', arg.Text, arg.UrlFile, arg.Options, arg.TemplateOption);

      case this.BotTemplateType.AUDIO: // audio should be in MP3, OGG, WAW format and no larger than 10MB.
        if (!arg.UrlFile) throw new Error('file was not passed');

        return sendDoubleMsg(botToken, recipientId, 'audio', arg.Text, arg.UrlFile, arg.Options, arg.TemplateOption);

      case this.BotTemplateType.DOCUMENT:
        if (!arg.UrlFile) throw new Error('file was not passed');

        return sendDoubleMsg(botToken, recipientId, 'file', arg.Text, arg.UrlFile, arg.Options, arg.TemplateOption);

      default:
        throw new Error('invalid template was passed');
    }
  }
}

module.exports = new Messenger();
