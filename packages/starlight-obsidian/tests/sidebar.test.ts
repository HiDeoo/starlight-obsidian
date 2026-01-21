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

  expect(getSidebarFromConfig(config, undefined, obsidianSidebarGroup)).toBeUndefined()
})

test('does nothing with an empty sidebar', () => {
  const config = getFixtureConfig('basics')

  expect(getSidebarFromConfig(config, [], obsidianSidebarGroup)).toEqual([])
})

test('does nothing for a sidebar without a placeholder', () => {
  const config = getFixtureConfig('basics')

  expect(getSidebarFromConfig(config, [gettingStartedLink], obsidianSidebarGroup)).toEqual([gettingStartedLink])
})

test('replaces a placeholder at the top level', () => {
  const config = getFixtureConfig('basics')

  expect(getSidebarFromConfig(config, [gettingStartedLink, obsidianSidebarGroup], obsidianSidebarGroup))
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
        "translations": {},
      },
    ]
  `)
})

test('replaces a nested placeholder', () => {
  const config = getFixtureConfig('basics')

  expect(
    getSidebarFromConfig(
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
            "translations": {},
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
    getSidebarFromConfig(
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
            "translations": {},
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
        "translations": {},
      },
    ]
  `)
})

test('uses a custom options if any', () => {
  const config = getFixtureConfig('basics', {
    output: 'custom-output',
    sidebar: { collapsed: true, collapsedFolders: false, label: 'Custom label', translations: {} },
  })

  expect(getSidebarFromConfig(config, [obsidianSidebarGroup], obsidianSidebarGroup)).toMatchInlineSnapshot(`
    [
      {
        "autogenerate": {
          "collapsed": false,
          "directory": "custom-output",
        },
        "collapsed": true,
        "label": "Custom label",
        "translations": {},
      },
    ]
  `)
})

test('replaces multiple placeholders for multiple plugin instances', () => {
  const config = getFixtureConfig('basics')

  const otherSidebarGroup = getSidebarGroupPlaceholder(Symbol('test'))

  expect(
    getSidebarFromConfig(config, [gettingStartedLink, obsidianSidebarGroup, otherSidebarGroup], obsidianSidebarGroup),
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
        "translations": {},
      },
      {
        "items": [],
        "label": "Symbol(test)",
      },
    ]
  `)

  expect(getSidebarFromConfig(config, [gettingStartedLink, obsidianSidebarGroup, otherSidebarGroup], otherSidebarGroup))
    .toMatchInlineSnapshot(`
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
        "translations": {},
      },
    ]
    `)
})

test('uses custom translations if any', () => {
  const config = getFixtureConfig('basics', {
    sidebar: {
      collapsed: false,
      label: 'Notes',
      translations: {
        fr: 'Notes',
        es: 'Notas',
      },
    },
  })

  expect(getSidebarFromConfig(config, [obsidianSidebarGroup], obsidianSidebarGroup)).toMatchInlineSnapshot(`
    [
      {
        "autogenerate": {
          "collapsed": false,
          "directory": "notes",
        },
        "collapsed": false,
        "label": "Notes",
        "translations": {
          "es": "Notas",
          "fr": "Notes",
        },
      },
    ]
  `)
})
