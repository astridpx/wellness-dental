import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppInput from '@/components/app/AppInput.vue'

describe('AppInput', () => {
  it('renders the provided label and placeholder', () => {
    const wrapper = mount(AppInput, {
      props: {
        label: 'Clinic Name',
        placeholder: 'Enter clinic name',
      },
    })

    expect(wrapper.text()).toContain('Clinic Name')
    expect(wrapper.find('input').attributes('placeholder')).toBe('Enter clinic name')
  })
})
