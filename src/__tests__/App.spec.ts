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

  it('restricts decimal-only inputs while typing', async () => {
    const wrapper = mount(AppInput, {
      props: {
        decimalOnly: true,
        inputmode: 'decimal',
        pattern: '[0-9]+([.][0-9]{2})?',
      },
    })

    const input = wrapper.find('input')
    await input.setValue('100a.005')

    expect(input.element.value).toBe('100.00')
    expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual(['100.00'])
    expect(input.attributes('pattern')).toBe('[0-9]+([.][0-9]{2})?')
  })
})
