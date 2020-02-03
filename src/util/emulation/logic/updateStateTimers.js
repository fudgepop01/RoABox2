

const updateStateTimers = (self) => {
  if (self.fields.prev_state === self.fields.state) {
    self.fields.state_timer++;
  }
  else self.fields.state_timer = 0;

  if (self.fields.state === 'PS_JUMPSQUAT' && self.fields.state_timer === self.fields.jump_start_time + 1) {
    self.fields.state = 'PS_FIRST_JUMP';
    if (self.fields.jump_down === true) self.fields.vsp = -self.fields.jump_speed
    else self.fields.vsp = -self.fields.short_hop_speed;
  }
}

export default updateStateTimers;