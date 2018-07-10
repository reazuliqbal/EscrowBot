import steemconnect from 'sc2-sdk';

const SC2 = steemconnect.Initialize({
  app: 'micro.app',
});

export default SC2;
