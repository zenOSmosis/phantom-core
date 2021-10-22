const test = require("tape-async");
const { deepMerge } = require("../src");

test("handles null options", t => {
  t.plan(2);

  const DEFAULT_OPTIONS = {
    a: 123,
    b: () => "hello",
  };

  const USER_OPTIONS = null;

  t.deepEquals(
    deepMerge(DEFAULT_OPTIONS, USER_OPTIONS),
    DEFAULT_OPTIONS,
    "accepts null user options"
  );

  t.deepEquals(
    deepMerge(null, null),
    {},
    "accepts null values for all merge options parameters"
  );

  t.end();
});

test("deep merge options of altered type", t => {
  t.plan(3);

  const defaultOptions = {
    audio: true,
    video: true,
  };

  const userLevelOptions = {
    audio: {
      quality: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        sampleSize: 16,
      },
    },
    video: {
      resolution: {
        width: 1920,
        height: 1280,
      },
    },
  };

  t.deepEquals(
    deepMerge(defaultOptions, {
      audio: userLevelOptions.audio,
    }),
    {
      audio: {
        quality: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          sampleSize: 16,
        },
      },
      video: true,
    },
    "changes audio from boolean to object type"
  );

  t.deepEquals(
    deepMerge(defaultOptions, {
      video: userLevelOptions.video,
    }),
    {
      audio: true,
      video: {
        resolution: {
          width: 1920,
          height: 1280,
        },
      },
    },
    "changes video from boolean to object type"
  );

  t.deepEquals(
    deepMerge(defaultOptions, userLevelOptions),
    {
      audio: {
        quality: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          sampleSize: 16,
        },
      },
      video: {
        resolution: {
          width: 1920,
          height: 1280,
        },
      },
    },
    "merges multiple type changes"
  );

  t.end();
});

test("deep merge options of same type", t => {
  t.plan(1);

  // NOTE: Despite the similarities, these data structures are not the same as
  // MediaStreamTrack constraints (just something to test with)
  const defaultOptions = {
    audio: {
      quality: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        sampleSize: 16,
      },
    },
    video: {
      resolution: {
        width: 1920,
        height: 1280,
      },
    },
  };

  const userLevelOptions = {
    audio: {
      quality: {
        autoGainControl: false,
      },
    },

    video: {
      resolution: {
        width: 640,
        height: 480,
      },
    },
  };

  t.deepEquals(deepMerge(defaultOptions, userLevelOptions), {
    audio: {
      quality: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
        sampleRate: 48000,
        sampleSize: 16,
      },
    },
    video: {
      resolution: {
        width: 640,
        height: 480,
      },
    },
  });

  t.end();
});
