import { expect, test } from 'vitest'

import starlightObsidianPlugin, { obsidianSidebarEntries } from '..'
import { getSidebarFromConfig, getSidebarEntriesPlaceholder } from '../libs/starlight'

import { getFixtureConfig } from './utils'

const gettingStartedLink = {
  label: 'Getting Started',
  link: '/guides/getting-started/',
}

test('does nothing with an undefined sidebar', () => {
  const config = getFixtureConfig('basics')

  expect(getTestSidebarFromConfig(config, undefined, obsidianSidebarEntries)).toBeUndefined()
})

test('does nothing with an empty sidebar', () => {
  const config = getFixtureConfig('basics')

  expect(getTestSidebarFromConfig(config, [], obsidianSidebarEntries)).toEqual([])
})

test('does nothing for a sidebar without a placeholder', () => {
  const config = getFixtureConfig('basics')

  expect(getTestSidebarFromConfig(config, [gettingStartedLink], obsidianSidebarEntries)).toEqual([gettingStartedLink])
})

test('replaces a placeholder at the top level', () => {
  const config = getFixtureConfig('basics')

  expect(getTestSidebarFromConfig(config, [gettingStartedLink, obsidianSidebarEntries], obsidianSidebarEntries))
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
          items: [obsidianSidebarEntries, gettingStartedLink],
        },
      ],
      obsidianSidebarEntries,
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
          items: [gettingStartedLink, obsidianSidebarEntries],
        },
        obsidianSidebarEntries,
      ],
      obsidianSidebarEntries,
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
          },
        ],
        "label": "Guides",
      },
      {
        "autogenerate": {
          "collapsed": false,
          "directory": "notes",
        },
      },
    ]
  `)
})

test('uses a custom options if any', () => {
  const config = getFixtureConfig('basics', {
    output: 'custom-output',
    sidebar: { collapsedFolders: true },
  })

  expect(getTestSidebarFromConfig(config, [obsidianSidebarEntries], obsidianSidebarEntries)).toMatchInlineSnapshot(`
    [
      {
        "autogenerate": {
          "collapsed": true,
          "directory": "custom-output",
        },
      },
    ]
  `)
})

test('replaces multiple placeholders for multiple plugin instances', () => {
  const config = getFixtureConfig('basics')

  const otherSidebarGroup = getSidebarEntriesPlaceholder(Symbol('test'))

  expect(
    getTestSidebarFromConfig(
      config,
      [gettingStartedLink, obsidianSidebarEntries, otherSidebarGroup],
      obsidianSidebarEntries,
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
      },
      {
        "autogenerate": {
          "directory": "Symbol(test)",
        },
      },
    ]
  `)

  expect(
    getTestSidebarFromConfig(
      config,
      [gettingStartedLink, obsidianSidebarEntries, otherSidebarGroup],
      otherSidebarGroup,
    ),
  ).toMatchInlineSnapshot(`
    [
      {
        "label": "Getting Started",
        "link": "/guides/getting-started/",
      },
      {
        "autogenerate": {
          "directory": "Symbol(StarlightObsidianSidebarEntriesDirectory)",
        },
      },
      {
        "autogenerate": {
          "collapsed": false,
          "directory": "notes",
        },
      },
    ]
  `)
})

test('throws when using the removed sidebar label option', () => {
  expect(() =>
    starlightObsidianPlugin({
      sidebar: {
        // @ts-expect-error - Testing removed option.
        label: 'Notes',
      },
      vault: '../fixtures/basics',
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `[AstroUserError: The \`sidebar.label\` and \`sidebar.collapsed\` options have been removed.]`,
  )
})

test('throws when using the removed sidebar collapsed option', () => {
  expect(() =>
    starlightObsidianPlugin({
      sidebar: {
        // @ts-expect-error - Testing removed option.
        collapsed: true,
      },
      vault: '../fixtures/basics',
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `[AstroUserError: The \`sidebar.label\` and \`sidebar.collapsed\` options have been removed.]`,
  )
})

function getTestSidebarFromConfig(
  config: Parameters<typeof getSidebarFromConfig>[0],
  sidebar: Parameters<typeof getSidebarFromConfig>[1]['sidebar'],
  placeholder: Parameters<typeof getSidebarFromConfig>[2],
) {
  return getSidebarFromConfig(config, { title: 'Test', sidebar }, placeholder)
}
