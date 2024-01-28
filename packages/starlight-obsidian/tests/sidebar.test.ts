import { expect, test } from 'vitest'

import { obsidianSidebarGroup } from '..'
import { getSidebarFromConfig } from '../libs/starlight'

import { getFixtureConfig } from './utils'

const gettingStartedLink = {
  label: 'Getting Started',
  link: '/guides/getting-started/',
}

test('does nothing with an undefined sidebar', () => {
  const config = getFixtureConfig('basics')

  expect(getSidebarFromConfig(config, undefined)).toBeUndefined()
})

test('does nothing with an empty sidebar', () => {
  const config = getFixtureConfig('basics')

  expect(getSidebarFromConfig(config, [])).toEqual([])
})

test('does nothing for a sidebar without a placeholder', () => {
  const config = getFixtureConfig('basics')

  expect(getSidebarFromConfig(config, [gettingStartedLink])).toEqual([gettingStartedLink])
})

test('replaces a placeholder at the top level', () => {
  const config = getFixtureConfig('basics')

  expect(getSidebarFromConfig(config, [gettingStartedLink, obsidianSidebarGroup])).toMatchInlineSnapshot(`
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
    getSidebarFromConfig(config, [
      {
        label: 'Guides',
        items: [obsidianSidebarGroup, gettingStartedLink],
      },
    ]),
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
    getSidebarFromConfig(config, [
      gettingStartedLink,
      {
        label: 'Guides',
        items: [gettingStartedLink, obsidianSidebarGroup],
      },
      obsidianSidebarGroup,
    ]),
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

  expect(getSidebarFromConfig(config, [obsidianSidebarGroup])).toMatchInlineSnapshot(`
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
