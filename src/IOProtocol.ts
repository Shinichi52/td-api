export const parseMessages = (str: string): any[] => {
  const packets = [];
  while (str.length > 0) {
    const x = /~m~(\d+)~m~/.exec(str);
    const packet = str.slice(x![0].length, x![0].length + parseInt(x![1], 10));
    if (packet.substr(0, 3) !== "~h~") {
      packets.push(JSON.parse(packet));
    } else {
      packets.push({ "~protocol~keepalive~": packet.substr(3) });
    }

    str.slice(0, x![0].length);
    str = str.slice(x![0].length + parseInt(x![1], 10));
  }
  return packets;
};

export const prependHeader = (str: string) => {
  return "~m~" + str.length + "~m~" + str;
};

export const createMessage = (func: string, paramList: MessageArguments) => {
  return prependHeader(constructMessage(func, paramList));
};

const constructMessage = (func: string, paramList: MessageArguments) => {
  return JSON.stringify({
    m: func,
    p: paramList
  });
};
