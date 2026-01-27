import { expect, test } from 'vitest'

import { obsidianSidebarGroup } from '..'
import { getSidebarFromConfig, getSidebarGroupPlaceholder } from '../libs/starlight'

import { getFixtureConfig } from './utils'

const gettingStartedLink = {
  label: 'Getting Started',
  link: '/guides/getting-started/',
}

test('does nothing with an undefined sidebar', () => {
  const config = getFixtureConfig('basics')

  expect(getTestSidebarFromConfig(config, undefined, obsidianSidebarGroup)).toBeUndefined()
})

test('does nothing with an empty sidebar', () => {
  const config = getFixtureConfig('basics')

  expect(getTestSidebarFromConfig(config, [], obsidianSidebarGroup)).toEqual([])
})

test('does nothing for a sidebar without a placeholder', () => {
  const config = getFixtureConfig('basics')

  expect(getTestSidebarFromConfig(config, [gettingStartedLink], obsidianSidebarGroup)).toEqual([gettingStartedLink])
})

test('replaces a placeholder at the top level', () => {
  const config = getFixtureConfig('basics')

  expect(getTestSidebarFromConfig(config, [gettingStartedLink, obsidianSidebarGroup], obsidianSidebarGroup))
    .toMatchInlineSnapshot(`
    [
      {
        "label": "Getting Started",
        "link": "/guides/getting-started/",
      },
      {
        "autogenerate": {
          "collapsed": false,
          "directory": "notes",
        },
        "collapsed": false,
        "label": "Notes",
      },
    ]
  `)
})

test('replaces a nested placeholder', () => {
  const config = getFixtureConfig('basics')

  expect(
    getTestSidebarFromConfig(
      config,
      [
        {
          label: 'Guides',
          items: [obsidianSidebarGroup, gettingStartedLink],
        },
      ],
      obsidianSidebarGroup,
    ),
  ).toMatchInlineSnapshot(`
    [
      {
        "items": [
          {
            "autogenerate": {
              "collapsed": false,
              "directory": "notes",
            },
            "collapsed": false,
            "label": "Notes",
          },
          {
            "label": "Getting Started",
            "link": "/guides/getting-started/",
          },
        ],
        "label": "Guides",
      },
    ]
  `)
})

test('replaces multiple placeholders', () => {
  const config = getFixtureConfig('basics')

  expect(
    getTestSidebarFromConfig(
      config,
      [
        gettingStartedLink,
        {
          label: 'Guides',
          items: [gettingStartedLink, obsidianSidebarGroup],
        },
        obsidianSidebarGroup,
      ],
      obsidianSidebarGroup,
    ),
  ).toMatchInlineSnapshot(`
    [
      {
        "label": "Getting Started",
        "link": "/guides/getting-started/",
      },
      {
        "items": [
          {
            "label": "Getting Started",
            "link": "/guides/getting-started/",
          },
          {
            "autogenerate": {
              "collapsed": false,
              "directory": "notes",
            },
            "collapsed": false,
            "label": "Notes",
          },
        ],
        "label": "Guides",
      },
      {
        "autogenerate": {
          "collapsed": false,
          "directory": "notes",
        },
        "collapsed": false,
        "label": "Notes",
      },
    ]
  `)
})

test('uses a custom options if any', () => {
  const config = getFixtureConfig('basics', {
    output: 'custom-output',
    sidebar: { collapsed: true, collapsedFolders: false, label: 'Custom label' },
  })

  expect(getTestSidebarFromConfig(config, [obsidianSidebarGroup], obsidianSidebarGroup)).toMatchInlineSnapshot(`
    [
      {
        "autogenerate": {
          "collapsed": false,
          "directory": "custom-output",
        },
        "collapsed": true,
        "label": "Custom label",
      },
    ]
  `)
})

test('replaces multiple placeholders for multiple plugin instances', () => {
  const config = getFixtureConfig('basics')

  const otherSidebarGroup = getSidebarGroupPlaceholder(Symbol('test'))

  expect(
    getTestSidebarFromConfig(
      config,
      [gettingStartedLink, obsidianSidebarGroup, otherSidebarGroup],
      obsidianSidebarGroup,
    ),
  ).toMatchInlineSnapshot(`
    [
      {
        "label": "Getting Started",
        "link": "/guides/getting-started/",
      },
      {
        "autogenerate": {
          "collapsed": false,
          "directory": "notes",
        },
        "collapsed": false,
        "label": "Notes",
      },
      {
        "items": [],
        "label": "Symbol(test)",
      },
    ]
  `)

  expect(
    getTestSidebarFromConfig(config, [gettingStartedLink, obsidianSidebarGroup, otherSidebarGroup], otherSidebarGroup),
  ).toMatchInlineSnapshot(`
    [
      {
        "label": "Getting Started",
        "link": "/guides/getting-started/",
      },
      {
        "items": [],
        "label": "Symbol(StarlightObsidianSidebarGroupLabel)",
      },
      {
        "autogenerate": {
          "collapsed": false,
          "directory": "notes",
        },
        "collapsed": false,
        "label": "Notes",
      },
    ]
    `)
})

test('uses custom translations if any', () => {
  const config = getFixtureConfig('basics', {
    sidebar: {
      collapsed: false,
      label: {
        en: 'Notes',
        es: 'Notas',
      },
    },
  })

  expect(getTestSidebarFromConfig(config, [obsidianSidebarGroup], obsidianSidebarGroup)).toMatchInlineSnapshot(`
    [
      {
        "autogenerate": {
          "collapsed": false,
          "directory": "notes",
        },
        "collapsed": false,
        "label": "Notes",
        "translations": {
          "en": "Notes",
          "es": "Notas",
        },
      },
    ]
  `)
})

test('throws if using translations without a key for the default language', () => {
  const config = getFixtureConfig('basics', {
    sidebar: {
      collapsed: false,
      label: {
        fr: 'Notes',
        es: 'Notas',
      },
    },
  })

  expect(() =>
    getTestSidebarFromConfig(config, [obsidianSidebarGroup], obsidianSidebarGroup),
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: The generated vault pages sidebar group label must have a key for the default language.]`,
  )
})

function getTestSidebarFromConfig(
  config: Parameters<typeof getSidebarFromConfig>[0],
  sidebar: Parameters<typeof getSidebarFromConfig>[1]['sidebar'],
  placeholder: Parameters<typeof getSidebarFromConfig>[2],
) {
  return getSidebarFromConfig(config, { title: 'Test', sidebar }, placeholder)
}
