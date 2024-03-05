import { type DOMWindow, JSDOM } from 'jsdom'
import { equal } from 'node:assert'
import { test } from 'node:test'
import { setTimeout } from 'node:timers/promises'

import { hotkeyKeyUX, focusGroupKeyUX, startKeyUX } from '../index.js'

function press(window: DOMWindow, key: string): void {
  let down = new window.KeyboardEvent('keydown', { bubbles: true, key })
  window.document.activeElement!.dispatchEvent(down)
  let up = new window.KeyboardEvent('keyup', { bubbles: true, key })
  window.document.activeElement!.dispatchEvent(up)
}

test('adds menu navigation', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])

  window.document.body.innerHTML =
    '<nav role="menu">' +
    '<a href="#" role="menuitem">Home</a>' +
    '<a href="#" role="menuitem">About</a>' +
    '<a href="#" role="menuitem">Contact</a>' +
    '</nav>'
  let items = window.document.querySelectorAll('a')
  items[0].focus()

  equal(window.document.activeElement, items[0])
  equal(
    window.document.body.innerHTML,
    '<nav role="menu">' +
      '<a href="#" role="menuitem">Home</a>' +
      '<a href="#" role="menuitem" tabindex="-1">About</a>' +
      '<a href="#" role="menuitem" tabindex="-1">Contact</a>' +
      '</nav>'
  )

  press(window, 'ArrowDown')
  equal(window.document.activeElement, items[1])
  equal(
    window.document.body.innerHTML,
    '<nav role="menu">' +
      '<a href="#" role="menuitem" tabindex="-1">Home</a>' +
      '<a href="#" role="menuitem" tabindex="0">About</a>' +
      '<a href="#" role="menuitem" tabindex="-1">Contact</a>' +
      '</nav>'
  )

  press(window, 'ArrowUp')
  equal(window.document.activeElement, items[0])

  press(window, 'End')
  equal(window.document.activeElement, items[2])

  press(window, 'Home')
  equal(window.document.activeElement, items[0])

  press(window, 'ArrowUp')
  equal(window.document.activeElement, items[2])

  press(window, 'ArrowDown')
  equal(window.document.activeElement, items[0])
})

test('adds menubar navigation', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])

  window.document.body.innerHTML =
    '<nav role="menubar" aria-orientation="vertical">' +
    '<a href="#" role="menuitem">Home</a>' +
    '<a href="#" role="menuitem">About</a>' +
    '<a href="#" role="menuitem">Contact</a>' +
    '</nav>'
  let items = window.document.querySelectorAll('a')
  items[0].focus()

  equal(window.document.activeElement, items[0])
  equal(
    window.document.body.innerHTML,
    '<nav role="menubar" aria-orientation="vertical">' +
      '<a href="#" role="menuitem">Home</a>' +
      '<a href="#" role="menuitem" tabindex="-1">About</a>' +
      '<a href="#" role="menuitem" tabindex="-1">Contact</a>' +
      '</nav>'
  )

  press(window, 'ArrowDown')
  equal(window.document.activeElement, items[1])
  equal(
    window.document.body.innerHTML,
    '<nav role="menubar" aria-orientation="vertical">' +
      '<a href="#" role="menuitem" tabindex="-1">Home</a>' +
      '<a href="#" role="menuitem" tabindex="0">About</a>' +
      '<a href="#" role="menuitem" tabindex="-1">Contact</a>' +
      '</nav>'
  )

  press(window, 'ArrowUp')
  equal(window.document.activeElement, items[0])

  press(window, 'End')
  equal(window.document.activeElement, items[2])

  press(window, 'Home')
  equal(window.document.activeElement, items[0])

  press(window, 'ArrowUp')
  equal(window.document.activeElement, items[2])

  press(window, 'ArrowDown')
  equal(window.document.activeElement, items[0])
})

test('stops tacking on loosing focus', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])

  window.document.body.innerHTML =
    '<nav role="menu">' +
    '<a href="#" role="menuitem">Home</a>' +
    '<a href="#" role="menuitem">About</a>' +
    '<a href="#" role="menuitem">Contact</a>' +
    '</nav>' +
    '<button>Button</button>'
  let button = window.document.querySelector('button')!
  let items = window.document.querySelectorAll('a')

  items[0].focus()
  items[0].blur()

  items[0].focus()
  button.focus()
  press(window, 'ArrowDown')
  equal(window.document.activeElement, button)

  items[0].focus()
  button.dispatchEvent(
    new window.KeyboardEvent('keydown', {
      bubbles: true,
      key: 'ArrowDown'
    })
  )
  equal(window.document.activeElement, items[0])
})

test('supports horizontal menus', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])

  window.document.body.innerHTML =
    '<nav role="menu" aria-orientation="horizontal">' +
    '<a href="#" role="menuitem">Home</a>' +
    '<a href="#" role="menuitem">About</a>' +
    '<a href="#" role="menuitem">Contact</a>' +
    '</nav>'
  let items = window.document.querySelectorAll('a')
  items[0].focus()

  press(window, 'ArrowRight')
  equal(window.document.activeElement, items[1])

  press(window, 'ArrowLeft')
  equal(window.document.activeElement, items[0])
})

test('moves focus by typing item name', async () => {
  let window = new JSDOM().window
  startKeyUX(window, [
    hotkeyKeyUX(),
    focusGroupKeyUX({
      searchDelayMs: 100
    })
  ])

  window.document.body.innerHTML =
    '<button aria-keyshortcuts="h">Button</button>' +
    '<nav role="menu">' +
    '<a href="#" role="menuitem">HOME</a>' +
    '<a href="#" role="menuitem">About</a>' +
    '<a href="#" role="menuitem"> agh  </a>' +
    '<a href="#" role="menuitem">Backspace</a>' +
    '</nav>'

  let clicked = 0
  window.document.querySelector('button')!.addEventListener('click', () => {
    clicked++
  })

  let items = window.document.querySelectorAll('a')
  items[0].focus()

  press(window, 'a')
  equal(window.document.activeElement, items[1])

  press(window, 'G')
  equal(window.document.activeElement, items[2])

  await setTimeout(150)
  press(window, 'h')
  equal(window.document.activeElement, items[0])
  equal(clicked, 0)

  press(window, 'a')
  equal(window.document.activeElement, items[0])

  await setTimeout(150)
  press(window, 'a')
  equal(window.document.activeElement, items[1])

  await setTimeout(150)
  press(window, 'Backspace')
  equal(window.document.activeElement, items[1])

  press(window, 'b')
  equal(window.document.activeElement, items[3])
})

test('supports RTL locales', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])

  window.document.dir = 'rtl'
  window.document.body.innerHTML =
    '<nav role="menu" aria-orientation="horizontal">' +
    '<a href="#" role="menuitem">Home</a>' +
    '<a href="#" role="menuitem">About</a>' +
    '<a href="#" role="menuitem">Contact</a>' +
    '</nav>'
  let items = window.document.querySelectorAll('a')
  items[0].focus()

  press(window, 'ArrowLeft')
  equal(window.document.activeElement, items[1])

  press(window, 'ArrowRight')
  equal(window.document.activeElement, items[0])
})

test('stops event tracking', () => {
  let window = new JSDOM().window
  let stop = startKeyUX(window, [focusGroupKeyUX()])

  window.document.body.innerHTML =
    '<nav role="menu">' +
    '<a href="#" role="menuitem">Home</a>' +
    '<a href="#" role="menuitem">About</a>' +
    '<a href="#" role="menuitem">Contact</a>' +
    '</nav>'
  let items = window.document.querySelectorAll('a')
  items[0].focus()

  press(window, 'ArrowDown')
  equal(window.document.activeElement, items[1])

  stop()
  press(window, 'ArrowDown')
  equal(window.document.activeElement, items[1])
})

test('ignores broken DOM', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])

  window.document.body.innerHTML =
    '<a href="#" role="menuitem">Home</a>' +
    '<a href="#" role="menuitem">About</a>' +
    '<a href="#" role="menuitem">Contact</a>'
  let items = window.document.querySelectorAll('a')
  items[0].focus()

  press(window, 'ArrowDown')
  equal(window.document.activeElement, items[0])

  window.document.body.innerHTML =
    '<nav role="menu">' +
    '<a href="#" role="menuitem">Home</a>' +
    '<a href="#" role="menuitem">About</a>' +
    '<a href="#" role="menuitem">Contact</a>' +
    '</nav>'
  let another = window.document.querySelectorAll('a')
  another[0].focus()

  window.document.querySelector('nav')!.role = ''
  press(window, 'ArrowDown')
  equal(window.document.activeElement, another[0])
})
